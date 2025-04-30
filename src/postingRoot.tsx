import { render } from "hono/jsx/dom";
import Posting from "./components/Posting";

const postingRoot = document.getElementById("posting-ui");
if (postingRoot) {
  render(<Posting />, postingRoot);
} else {
  console.error("Root element with id 'posting-ui' not found.");
}
