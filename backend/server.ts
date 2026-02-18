import app from './src/app';
import { config } from './src/config';
import { connectDB } from './src/config/db';
import { logger } from './src/utils/logger';

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

start();