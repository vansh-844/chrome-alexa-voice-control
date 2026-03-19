import dotenv from "dotenv";

dotenv.config();

class Config {
  readonly openaiApiKey: string;
  readonly port: number;
  readonly chromeExecutablePath: string;
  readonly alexaSkillSecret: string | undefined;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required");
    }
    if (!process.env.CHROME_EXECUTABLE_PATH) {
      throw new Error("CHROME_EXECUTABLE_PATH is required");
    }

    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    this.chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH;
    this.alexaSkillSecret = process.env.ALEXA_SKILL_SECRET;
  }
}

export const config = new Config();
