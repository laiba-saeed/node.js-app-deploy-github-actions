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
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;