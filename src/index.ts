import express from "express";
import { config } from "./config/env.js";
import { alexaRouter } from "./routes/alexa.js";

const app = express();
app.use(express.json());
app.use("/", alexaRouter);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});

process.on("SIGINT", () => {
  process.exit(0);
});
