import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
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

  const sent = sendToSelectedDevices({
    type: "file-transfer",
    message,
    sendAsContact,
    files,
    selectedTags,
    postingType,
    selectedDevices,
  });

  return c.json({ status: "ok", sent });
});

const server = serve({ fetch: app.fetch, port: 3000 });
setupWebSocketServer(server);
console.log("🚀 Admin panel live at http://localhost:3000");
