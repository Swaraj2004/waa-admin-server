import path from "path";
import { WebSocketServer, WebSocket as WsWebSocket } from "ws";
import XLSX from "xlsx";
import {
  enqueueMessage,
  getDeviceQueue,
  getQueueCount,
  saveDeviceQueue,
} from "./msg-queue";

const clients = new Map<
  string,
  {
    ws: WsWebSocket;
    contactTags: string[];
    groupTags: string[];
    contactPosting: boolean;
    groupPosting: boolean;
  }
>();
const heartbeats = new Map<WsWebSocket, boolean>();

export function getDeviceStatuses() {
  const workbook = XLSX.readFile(path.join(process.cwd(), "phones.xlsx"));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const phones = XLSX.utils.sheet_to_json<{ phone_name: string }>(sheet);

  const statusMap: Record<
    string,
    {
      online: boolean;
      contactTags: string[];
      groupTags: string[];
      contactPosting: boolean;
      groupPosting: boolean;
      queueCount: number;
    }
  > = {};

  phones.forEach((row) => {
    const name = row.phone_name;
    const client = clients.get(name);
    statusMap[name] = {
      online: !!client,
      contactTags: client?.contactTags || [],
      groupTags: client?.groupTags || [],
      contactPosting: client?.contactPosting || false,
      groupPosting: client?.groupPosting || false,
      queueCount: getQueueCount(name),
    };
  });

  return statusMap;
}

export function sendToSelectedDevices(data: {
  type: string;
  message: string;
  sendAsContact: boolean;
  files: { name: string; caption: string; base64: string };
  selectedTags: string[];
  selectedDevices: string[];
  postingType: "contact" | "group";
}): number {
  const statuses = getDeviceStatuses();
  let sent = 0;

  for (const name of data.selectedDevices) {
    const client = clients.get(name);
    const status = statuses[name];

    const isOnline = status?.online;
    const isBusy = status?.contactPosting || status?.groupPosting;

    if (client && isOnline && !isBusy) {
      client.ws.send(JSON.stringify(data));
      client.contactPosting = data.postingType === "contact";
      client.groupPosting = data.postingType === "group";
      sent++;
    } else {
      enqueueMessage(name, data);
    }
  }

  return sent;
}

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let registeredName: string = "";

    heartbeats.set(ws, true);

    ws.on("pong", () => {
      heartbeats.set(ws, true);
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "register" && message.name) {
          registeredName = message.name;
          const contactTags: string[] = message.contactTags || [];
          const groupTags: string[] = message.groupTags || [];
          clients.set(registeredName, {
            ws,
            contactTags,
            groupTags,
            contactPosting: false,
            groupPosting: false,
          });
          console.log(`📲 ${registeredName} connected`);
        } else if (message.type === "posting-status") {
          const client = clients.get(registeredName);
          if (client) {
            client.contactPosting = message.contactPosting;
            client.groupPosting = message.groupPosting;
          }
        }
      } catch (err) {
        console.error("❌ Invalid message:", err);
      }
    });

    ws.on("close", () => {
      heartbeats.delete(ws);
      if (registeredName) {
        clients.delete(registeredName);
        console.log(`🔌 ${registeredName} disconnected`);
      }
    });
  });

  setInterval(() => {
    for (const ws of wss.clients) {
      if (!heartbeats.get(ws)) {
        ws.terminate();
        continue;
      }
      heartbeats.set(ws, false);
      ws.ping();
    }
  }, 10000);
}

function processDeviceQueues() {
  const statuses = getDeviceStatuses();

  for (const name in statuses) {
    const status = statuses[name];
    const client = clients.get(name);
    if (!client) continue;

    const queue = getDeviceQueue(name);
    if (!queue.length) continue;

    const nextMsg = queue[0];

    const busy = status.contactPosting || status.groupPosting;

    if (!status.online || busy) continue;

    client.ws.send(JSON.stringify(nextMsg));

    if (nextMsg.postingType === "contact") {
      client.contactPosting = true;
    } else {
      client.groupPosting = true;
    }

    queue.shift();
    saveDeviceQueue(name, queue);
  }
}

setInterval(processDeviceQueues, 8000);
