import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import config from "./config";

import logger from "./lib/logger";
import { validateProductionJwtSecret } from "./config/security";

validateProductionJwtSecret();

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});
