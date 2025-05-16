import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const QUEUE_DIR = path.join(projectRoot, "queues");

if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR);

const getQueueFile = (deviceName: string) =>
  path.join(QUEUE_DIR, `${deviceName}.json`);

export function getDeviceQueue(deviceName: string): {
  type: string;
  message: string;
  sendAsContact: boolean;
  files: { name: string; caption: string; base64: string };
  selectedTags: string[];
  selectedDevices: string[];
  postingType: "contact" | "group";
  status: string;
  id: string;
}[] {
  const file = getQueueFile(deviceName);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDeviceQueue(
  deviceName: string,
  queue: {
    type: string;
    message: string;
    sendAsContact: boolean;
    files: { name: string; caption: string; base64: string };
    selectedTags: string[];
    selectedDevices: string[];
    postingType: "contact" | "group";
    status: string;
    id: string;
  }[]
) {
  const file = getQueueFile(deviceName);
  fs.writeFileSync(file, JSON.stringify(queue, null, 2), "utf-8");
}

export function enqueueMessage(
  deviceName: string,
  message: {
    type: string;
    message: string;
    sendAsContact: boolean;
    files: { name: string; caption: string; base64: string };
    selectedTags: string[];
    selectedDevices: string[];
    postingType: "contact" | "group";
  }
) {
  const queue = getDeviceQueue(deviceName);
  queue.push({ ...message, status: "queued", id: crypto.randomUUID() });
  saveDeviceQueue(deviceName, queue);
}

export function getQueueCount(deviceName: string): number {
  const queue = getDeviceQueue(deviceName);
  return queue.length;
}
