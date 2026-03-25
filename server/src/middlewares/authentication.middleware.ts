import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Connection } from 'mongoose';
import { getConnection } from '../utils/Connections.js';
import { ApiError } from '../utils/ApiError.js';
import { decodeAccessToken } from '../functions/token.functions.js';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken =
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies['accessToken'];

    if (!accessToken) {
      throw ApiError.unauthorized('No token, authorization denied');
    }
    try {
      const accessTokenDecoded = decodeAccessToken(accessToken) as {
        userId: string;
        exp: number;
      };

      if (!accessTokenDecoded || !accessTokenDecoded.userId) {
        throw ApiError.unauthorized('Invalid token');
      }
      req.userId = accessTokenDecoded.userId;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Access Token expired');
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
};
