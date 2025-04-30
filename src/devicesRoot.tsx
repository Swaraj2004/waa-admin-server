import { render } from "hono/jsx/dom";
import { DeviceStatus } from "./components/DeviceStatus";

const devicesRoot = document.getElementById("device-ui");
if (devicesRoot) {
  render(<DeviceStatus />, devicesRoot);
} else {
  console.error("Root element with id 'device-ui' not found.");
}
