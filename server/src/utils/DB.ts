import logger, { addTransports } from './Logger.js';
import { getConnection } from './Connections.js';
import { ApiError } from './ApiError.js';
import { getUsersModel } from '../models/users.model.js';

export async function connectDB(): Promise<void> {
  try {
    const dbConnection = await getConnection();
    getUsersModel(dbConnection);
    addTransports();
  } catch (err) {
    const errorMessage = 'MongoDB MasterDB Connection Error';

    if (err instanceof ApiError) {
      logger.error(errorMessage, err.message, err.metadata);
    } else {
      logger.error(errorMessage, err);
    }

    process.exit(1);
  }
}
