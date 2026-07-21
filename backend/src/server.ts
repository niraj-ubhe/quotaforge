import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import config from "./config";

import logger from "./lib/logger";

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});