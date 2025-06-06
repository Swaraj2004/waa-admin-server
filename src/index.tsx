import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import path from "path";
import { Layout } from "./components/Layout";
import {
  getDeviceStatuses,
  sendToSelectedDevices,
  setupWebSocketServer,
} from "./ws-server";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/", async (c) => {
  return c.html(
    <Layout path="/">
      <div id="device-ui"></div>
      <script src="/static/devicesRoot.js" type="module"></script>
    </Layout>
  );
});

app.get("/posting", async (c) => {
  return c.html(
    <Layout path="/posting">
      <div id="posting-ui"></div>
      <script src="/static/postingRoot.js" type="module"></script>
    </Layout>
  );
});

app.get("/api/devices", (c) => {
  return c.json(getDeviceStatuses());
});

app.post("/api/start-posting", async (c) => {
  const body = await c.req.json();
  const {
    message,
    sendAsContact,
    files,
    selectedTags,
    selectedDevices,
    postingType,
  } = body;

  const uploadDir = path.join(process.cwd(), "public", "files");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const savedFiles = files.map(
    (file: { name: string; caption: string; base64: string }) => {
      const buffer = Buffer.from(file.base64, "base64");
      const uniqueName = `${nanoid(10)}-${file.name}`;
      const filePath = path.join(uploadDir, uniqueName);

      fs.writeFileSync(filePath, buffer);

      return {
        name: file.name,
        caption: file.caption,
        path: `/files/${uniqueName}`,
      };
    }
  );

  const sent = sendToSelectedDevices({
    type: "file-transfer",
    message,
    sendAsContact,
    files: savedFiles,
    selectedTags,
    postingType,
    selectedDevices,
  });

  return c.json({ status: "ok", sent });
});

const server = serve({ fetch: app.fetch, port: 3000 });
setupWebSocketServer(server);
console.log("🚀 Admin panel live at http://localhost:3000");
