import express from "express";

function parseCompletedFilter(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  let nextTaskId = 1;
  const tasks = [];

  app.get("/", (req, res) => {
    res.json({
      name: "Task Flow API",
      version: "1.0.0",
      endpoints: [
        "GET /health",
        "GET /tasks",
        "POST /tasks",
        "PATCH /tasks/:id",
        "DELETE /tasks/:id",
        "GET /tasks/summary"
      ]
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/tasks", (req, res) => {
    const completedFilter = parseCompletedFilter(req.query.completed);
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

    if (completedFilter === null) {
      return res.status(400).json({
        error: "Invalid completed query. Use true or false."
      });
    }

    let filteredTasks = tasks;

    if (completedFilter !== undefined) {
      filteredTasks = filteredTasks.filter((task) => task.completed === completedFilter);
    }

    if (searchQuery) {
      filteredTasks = filteredTasks.filter((task) => task.title.toLowerCase().includes(searchQuery));
    }

    return res.json({ data: filteredTasks });
  });

  app.post("/tasks", (req, res) => {
    const rawTitle = req.body?.title;
    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";

    if (!title || title.length > 120) {
      return res.status(400).json({
        error: "title is required and must be 1-120 characters."
      });
    }

    const task = {
      id: nextTaskId++,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    return res.status(201).json({ data: task });
  });

  app.patch("/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const { title, completed } = req.body ?? {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
        return res.status(400).json({
          error: "title must be a non-empty string up to 120 characters."
        });
      }
      task.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          error: "completed must be a boolean."
        });
      }
      task.completed = completed;
    }

    return res.json({ data: task });
  });

  app.delete("/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);
    const taskIndex = tasks.findIndex((item) => item.id === taskId);

    if (taskIndex < 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    tasks.splice(taskIndex, 1);
    return res.status(204).send();
  });

  app.get("/tasks/summary", (req, res) => {
    const completedCount = tasks.filter((task) => task.completed).length;
    res.json({
      data: {
        total: tasks.length,
        completed: completedCount,
        pending: tasks.length - completedCount
      }
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found." });
  });

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;