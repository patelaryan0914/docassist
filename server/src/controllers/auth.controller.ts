import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  decodeRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '../functions/token.functions.js';
import { getConnection } from '../utils/Connections.js';
import {
  isEmail,
  isMobileNumber,
} from '../functions/helper.functions.js';
import { getAccountsModel } from '../models/accounts.model.js';
import {
  hashPassword,
  verifyPassword,
} from '../functions/encrypt.functions.js'
import { type ClientSession } from 'mongoose';
import { getUsersModel, IUsers } from "../models/users.model.js";

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  domain: process.env.NODE_ENV === 'production' ? '.aryan-dev.in' : 'localhost',
  sameSite: 'lax' as const,
  maxAge,
});

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let session: ClientSession | undefined;
  try {
    const {
      email_number,
      name,
      password,
    } = req.body;
    const dbConnection = await getConnection()
    const User = getUsersModel(dbConnection);
    const Account = getAccountsModel(dbConnection);
    session = await dbConnection.startSession();
    session.startTransaction();
    const existingUser = await User.findOne({
      $or: [{ mobileNumber: email_number }, { email: email_number }],
    }).session(session);
    if (existingUser) {
      throw ApiError.conflict(
        'User with given email or mobile number already exists',
      );
    }
    let user: IUsers | null = null;
    if (isMobileNumber(email_number)) {
      const newUser = new User({
        name,
        mobileNumber: email_number,
        status: "verified",
      });
      await newUser.save({ session });
      user = newUser;
    } else if (isEmail(email_number)) {
      const newUser = new User({
        name,
        email: email_number,
        status: "verified"
      });
      await newUser.save({ session });
      user = newUser;
    } else {
      throw ApiError.badRequest('Invalid email or mobile number');
    }
    const newAccount = new Account({
      userId: user!._id,
      provider: 'credentials',
      password: await hashPassword(password),
    });
    await newAccount.save({ session });
    await session.commitTransaction();
    session.endSession();
    const accessToken = generateAccessToken({
      userId: user!._id.toString(),
    });
    const refreshToken = generateRefreshToken({
      userId: user!._id.toString(),
    });
    res
      .status(201)
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.aryan-dev.in' : 'localhost',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.aryan-dev.in' : 'localhost',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 * 365,
      })
      .json(
        ApiResponse.success(
          { accessToken, refreshToken, userDetails: user },
          'User registered successfully',
        ),
      );
    return;
  } catch (error) {
    try {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortErr) {
      req.logger.error("Mongodb session abort error", abortErr);
    } finally {
      if (session) session.endSession();
    }
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email_number, password } = req.body;
    const dbConnection = await getConnection()
    const User = getUsersModel(dbConnection);
    const Account = getAccountsModel(dbConnection);
    const user = await User.findOne({
      $or: [{ mobileNumber: email_number }, { email: email_number }],
    }).select('mobileNumber email name verified');
    if (!user) {
      throw ApiError.unauthorized('User does not exist!');
    }
    if (user.status == 'deleted') {
      throw ApiError.unauthorized(
        'Your account is deleted contact admin to recover.',
      );
    }
    const account = await Account.findOne({
      userId: user._id,
      provider: 'credentials',
    });
    if (!account) {
      throw ApiError.unauthorized('Account does not exist!');
    }
    const isPasswordValid = await verifyPassword(
      password,
      account.password!,
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const accessToken = generateAccessToken({
      userId: user._id,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id,
    });
    res
      .status(201)
      .cookie('accessToken', accessToken, cookieOptions(24 * 60 * 60 * 1000))
      .cookie(
        'refreshToken',
        refreshToken,
        cookieOptions(24 * 60 * 60 * 1000 * 365),
      )
      .json(
        ApiResponse.success(
          {
            userDetails: user,
            accessToken,
            refreshToken,
          },
          'User signed in successfully',
        ),
      );
    return;
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const headerToken = req.header('x-refresh-token')?.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    const token = headerToken || cookieToken;

    if (!token) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    let decoded: { userId: string };
    try {
      decoded = decodeRefreshToken(token) as { userId: string };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Refresh token expired');
      }
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (!decoded?.userId) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const dbConnection = await getConnection();
    const User = getUsersModel(dbConnection);
    const user = await User.findById(decoded.userId).select('_id status');

    if (!user) {
      throw ApiError.unauthorized('User does not exist');
    }
    if (user.status === 'deleted') {
      throw ApiError.unauthorized(
        'Your account is deleted contact admin to recover.',
      );
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions(24 * 60 * 60 * 1000))
      .cookie(
        'refreshToken',
        refreshToken,
        cookieOptions(24 * 60 * 60 * 1000 * 365),
      )
      .json(
        ApiResponse.success(
          { accessToken, refreshToken },
          'Token refreshed successfully',
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbConnection = await getConnection();
    const User = getUsersModel(dbConnection);
    const user = await User.findById(req.userId).select(
      'name email mobileNumber photo status',
    );
    if (!user) {
      throw ApiError.unauthorized('User does not exist');
    }
    res.status(200).json(
      ApiResponse.success({ userDetails: user }, 'User fetched successfully'),
    );
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, photo } = req.body as {
      name?: string;
      email?: string;
      photo?: string;
    };

    const dbConnection = await getConnection();
    const User = getUsersModel(dbConnection);
    const user = await User.findById(req.userId);
    if (!user) {
      throw ApiError.unauthorized('User does not exist');
    }
    if (user.status === 'deleted') {
      throw ApiError.unauthorized(
        'Your account is deleted contact admin to recover.',
      );
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      if (!isEmail(email.trim())) {
        throw ApiError.badRequest('Invalid email address');
      }
      const existing = await User.findOne({
        email: email.trim(),
        _id: { $ne: user._id },
      });
      if (existing) {
        throw ApiError.conflict('Email is already in use');
      }
      user.email = email.trim();
    }
    if (typeof photo === 'string') {
      user.photo = photo;
    }

    await user.save();

    res.status(200).json(
      ApiResponse.success(
        {
          userDetails: {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            photo: user.photo,
          },
        },
        'Profile updated successfully',
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  res
    .status(200)
    .clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.aryan-dev.in' : undefined,
      sameSite: 'lax',
      path: '/',
    })
    .clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.aryan-dev.in' : undefined,
      sameSite: 'lax',
      path: '/',
    })
    .json(ApiResponse.success(
      {},
      'User signed out successfully',
    ),);
};
