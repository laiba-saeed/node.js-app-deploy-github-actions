import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./index.js";

let server;
let baseUrl;

beforeEach(() => {
  server = createApp().listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(() => {
  server.close();
});

test("GET /health returns ok", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "not-ok");
});

test("POST /tasks creates task and GET /tasks returns it", async () => {
  const createResponse = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Write CI docs" })
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.data.title, "Write CI docs");
  assert.equal(created.data.completed, false);

  const listResponse = await fetch(`${baseUrl}/tasks`);
  const listed = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(listed.data.length, 1);
  assert.equal(listed.data[0].title, "Write CI docs");
});

test("PATCH /tasks/:id updates title and completed flag", async () => {
  const createResponse = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Initial title" })
  });
  const created = await createResponse.json();
  const taskId = created.data.id;

  const updateResponse = await fetch(`${baseUrl}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated title", completed: true })
  });
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updated.data.title, "Updated title");
  assert.equal(updated.data.completed, true);
});

test("GET /tasks/summary returns total/completed/pending counts", async () => {
  const createTask = (title) =>
    fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });

  await createTask("Task 1");
  const secondTaskResponse = await createTask("Task 2");
  const secondTask = await secondTaskResponse.json();

  await fetch(`${baseUrl}/tasks/${secondTask.data.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true })
  });

  const summaryResponse = await fetch(`${baseUrl}/tasks/summary`);
  const summary = await summaryResponse.json();

  assert.equal(summaryResponse.status, 200);
  assert.equal(summary.data.total, 2);
  assert.equal(summary.data.completed, 1);
  assert.equal(summary.data.pending, 1);
});

test("POST /tasks rejects invalid title", async () => {
  const response = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /title is required/i);
});

test("DELETE /tasks/:id deletes task", async () => {
  const createResponse = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Delete me" })
  });
  const created = await createResponse.json();

  const deleteResponse = await fetch(`${baseUrl}/tasks/${created.data.id}`, {
    method: "DELETE"
  });

  assert.equal(deleteResponse.status, 204);

  const listResponse = await fetch(`${baseUrl}/tasks`);
  const listed = await listResponse.json();
  assert.equal(listed.data.length, 0);
});
