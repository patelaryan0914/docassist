import { getHospitalConnection } from '../utils/Connections.js';
import jwt from 'jsonwebtoken';
import { decodeAccessToken } from '../functions/token.functions.js';
import { IScopes } from '../models/scopes.model.js';
import { ApiError } from '../utils/ApiError.js';

export const socketAuthentication = async (socket: any, next: any) => {
  try {
    const accessToken = socket.handshake.headers.authorization.replace(
      'Bearer ',
      '',
    );
    if (!accessToken) {
      return next(new Error('Authentication token missing'));
    }
    try {
      const accessTokenDecoded = decodeAccessToken(accessToken) as {
        userId: string;
        userType: string;
        scope: IScopes[];
        uniqueCode: string;
        exp: number;
      };
      if (!accessTokenDecoded || !accessTokenDecoded.userId) {
        throw ApiError.unauthorized('Invalid token');
      }
      const hospitalDbConnection = await getHospitalConnection(
        accessTokenDecoded.uniqueCode,
      );
      const masterDbConnection = await getHospitalConnection('master-db1');
      socket.data.userId = accessTokenDecoded.userId;
      socket.data.userType = accessTokenDecoded.userType;
      socket.data.uniqueCode = accessTokenDecoded.uniqueCode;
      socket.data.scope = accessTokenDecoded.scope;
      socket.data.hospitalDbConnection = hospitalDbConnection;
      socket.data.masterDbConnection = masterDbConnection;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Access Token expired');
      }
    }
    next();
  } catch (err) {
    next(new Error('Unauthorized: Invalid token'));
  }
};
