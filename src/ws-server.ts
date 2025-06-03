import { randomUUID } from "crypto";
import path from "path";
import { WebSocketServer, WebSocket as WsWebSocket } from "ws";
import XLSX from "xlsx";
import {
  enqueueMessage,
  getDeviceQueue,
  getQueueCount,
  saveDeviceQueue,
} from "./msg-queue";

const CHUNK_SIZE = 64 * 1024;

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

function sendFileInChunks(
  ws: WsWebSocket,
  fileBuffer: Buffer,
  name: string,
  caption: string
) {
  const fileId = randomUUID();
  const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

  const metadata = {
    type: "file-metadata",
    fileId,
    name,
    caption,
    size: fileBuffer.length,
    totalChunks,
  };

  ws.send(JSON.stringify(metadata));

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
    const chunk = fileBuffer.subarray(start, end);

    const header = Buffer.from(
      JSON.stringify({
        type: "file-chunk",
        fileId,
        index: i,
      }) + "\n"
    );

    const payload = Buffer.concat([header, chunk]);
    ws.send(payload);
  }

  ws.send(
    JSON.stringify({
      type: "file-complete",
      fileId,
    })
  );
}

export function sendToSelectedDevices(data: {
  type: string;
  message: string;
  sendAsContact: boolean;
  files: { name: string; caption: string; base64: string }[];
  selectedTags: string[];
  selectedDevices: string[];
  postingType: "contact" | "group";
}): number {
  const statuses = getDeviceStatuses();
  let sent = 0;

  const tasks = data.selectedDevices.map((name) => {
    const client = clients.get(name);
    const status = statuses[name];

    const isOnline = status?.online;
    const isBusy = status?.contactPosting || status?.groupPosting;

    if (client && isOnline && !isBusy) {
      return new Promise<void>((resolve) => {
        try {
          const { files, ...rest } = data;

          client.ws.send(JSON.stringify(rest), () => {
            client.contactPosting = data.postingType === "contact";
            client.groupPosting = data.postingType === "group";
            sent++;

            if (Array.isArray(files)) {
              for (const file of files) {
                const buffer = Buffer.from(file.base64, "base64");
                sendFileInChunks(client.ws, buffer, file.name, file.caption);
              }
            }

            client.ws.send(
              JSON.stringify({
                type: "file-transfer-complete",
              })
            );

            resolve();
          });
        } catch {
          resolve();
        }
      });
    } else {
      enqueueMessage(name, data);
      return Promise.resolve();
    }
  });

  Promise.allSettled(tasks);
  return sent;
}

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let registeredName = "";

    heartbeats.set(ws, true);
    ws.on("pong", () => heartbeats.set(ws, true));

    ws.on("message", (data) => {
      try {
        let message: any;

        // If Buffer, try to parse as string
        if (Buffer.isBuffer(data)) {
          const asString = data.toString("utf8");
          try {
            message = JSON.parse(asString);
          } catch {
            // Not a JSON string — ignore, likely binary file chunk
            return;
          }
        } else if (typeof data === "string") {
          message = JSON.parse(data);
        } else {
          return;
        }

        if (message && message.type === "register" && message.name) {
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

    const { files, ...rest } = nextMsg;
    client.ws.send(JSON.stringify(rest));

    if (Array.isArray(files)) {
      for (const file of files) {
        const buffer = Buffer.from(file.base64, "base64");
        sendFileInChunks(client.ws, buffer, file.name, file.caption);
      }
    }

    client.ws.send(
      JSON.stringify({
        type: "file-transfer-complete",
      })
    );

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
