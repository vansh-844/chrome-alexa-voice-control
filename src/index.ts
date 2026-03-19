import express from "express";
import { config } from "./config/env.js";
import { browserService } from "./services/browser.js";
import { alexaRouter } from "./routes/alexa.js";

const app = express();
app.use(express.json());
app.use("/", alexaRouter);

async function start() {
  await browserService.connect();
  console.log("Browser connected.");

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });

  process.on("SIGINT", async () => {
    await browserService.disconnect();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
