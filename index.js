import express from "express";

function createApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== "test") {
  app.listen(8080, () => {
    console.log("Server is running on port 8080");
  });
}

export default app;