import path from "path";
import { WebSocketServer, WebSocket as WsWebSocket } from "ws";
import XLSX from "xlsx";

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
    };
  });

  return statusMap;
}

export function sendToSelectedDevices(data: {
  type: string;
  message: string;
  files: { name: string; caption: string; base64: string };
  selectedTags: string[];
  selectedDevices: string[];
  postingType: string;
}): number {
  let sent = 0;
  const payload = JSON.stringify(data);

  for (const name of data.selectedDevices) {
    const client = clients.get(name);
    if (client && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload);
      sent++;
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
