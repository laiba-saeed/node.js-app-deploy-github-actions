import { after, test } from "node:test";
import assert from "node:assert/strict";
import app from "./index.js";

const server = app.listen(0);

after(() => {
  server.close();
});

test("GET / returns Hello World", async () => {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(body, "Hello World");
});
