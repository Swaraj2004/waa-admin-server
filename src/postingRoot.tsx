import { render } from "hono/jsx/dom";
import PostingPage from "./components/PostingPage";

const postingRoot = document.getElementById("posting-ui");
if (postingRoot) {
  render(<PostingPage />, postingRoot);
} else {
  console.error("Root element with id 'posting-ui' not found.");
}
