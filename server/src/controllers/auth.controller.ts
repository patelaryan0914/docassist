import type { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import axios from 'axios';
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
import {
  getGoogleAuthURL,
  googleClient,
} from '../functions/google.functions.js';
import { type ClientSession } from 'mongoose';
import { getUsersModel, IUsers } from "../models/users.model.js";

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
      userType,
      uniqueCode,
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
    const { signInWith, email_number, password } =
      req.body;
    switch (signInWith) {
      case 'google':
        try {
          const { userType = 'patient' } = req.body;
          const url = getGoogleAuthURL({ userType });
          res.status(200).json(ApiResponse.success({ url }, 'Google Auth URL'));
          return;
        } catch (error) {
          next(error);
        }
        break;
      case 'credentials':
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
          .cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.in' : 'localhost',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
          })
          .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.in' : 'localhost',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 * 365,
          })
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
        break;
      default:
        break;
    }
    return;
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let session: ClientSession | undefined;
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      throw ApiError.badRequest('Missing code or state');
    }

    const data = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    const { tokens } = await googleClient.getToken(code);
    if (!tokens) throw ApiError.badRequest('Failed to exchange token');

    googleClient.setCredentials(tokens);

    const { data: google } = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );

    const { email, name, picture } = google;
    const dbConnection = await getConnection();
    session = await dbConnection.startSession();
    session.startTransaction();
    const User = getUsersModel(dbConnection);
    const Account = getAccountsModel(dbConnection);
    let existingUser = await User.findOne({ email }).session(session);

    if (existingUser) {
      let account = await Account.findOne({ userId: existingUser._id }).session(session);

      if (account) {
        account.provider = 'google';
        account.accessToken = tokens.access_token;
        account.idToken = tokens.id_token;
        if (tokens.expiry_date)
          account.accessTokenExpiresAt = new Date(tokens.expiry_date);
        if (tokens.refresh_token) account.refreshToken = tokens.refresh_token;

        await account.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
      const accessToken = generateAccessToken({
        userId: existingUser._id,
      });
      const refreshToken = generateRefreshToken({
        userId: existingUser._id,
      });
      res
        .status(201)
        .cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.in' : 'localhost',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        })
        .cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.in' : 'localhost',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 * 365,
        })
        .json(
          ApiResponse.success(
            {
              accessToken,
              refreshToken,
            },
            'User signed in successfully',
          ),
        );
      return;
    }
    const newUser = new User({
      name,
      photo: picture,
      email,
      emailVerified: true,
      status: "verified"
    });
    await newUser.save({ session });
    await Account.create({
      userId: newUser._id,
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      accessTokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
    }, { session });
    await session.commitTransaction();
    session.endSession();
    const accessToken = generateAccessToken({
      userId: newUser._id,
    });
    const refreshToken = generateRefreshToken({
      userId: newUser._id,
    });

    res
      .status(201)
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.om' : undefined,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'aryan-dev.in' : undefined,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 * 365,
      })
      .json(
        ApiResponse.success(
          {
            accessToken,
            refreshToken,
          },
          'User signed in successfully',
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

export const googleLoginWithIdToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let session: ClientSession | undefined;
  try {
    const { idToken, userType } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [process.env.GOOGLE_CLIENT_ID_ANDROID!, process.env.GOOGLE_CLIENT_ID_WEB!],
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw ApiError.unauthorized('Invalid Google token');
    }

    const {
      email,
      name,
      picture,
      email_verified,
      sub: googleId,
    } = payload;

    const dbConnection = await getConnection();
    const User = getUsersModel(dbConnection);
    const Account = getAccountsModel(dbConnection);
    const baseConn = await getConnection();
    session = await baseConn.startSession();
    session.startTransaction();
    let user = await User.findOne({ email }).session(session);
    if (user) {
      await Account.updateOne(
        { userId: user._id, provider: 'google' },
        {
          $set: {
            provider: 'google',
            idToken: googleId,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      ).session(session);
      await session.commitTransaction();
      session.endSession();

      const accessToken = generateAccessToken({
        userId: user._id,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id,
      });

      res.status(200).json(
        ApiResponse.success(
          {
            userDetails: user,
            accessToken,
            refreshToken,
          },
          'Login successful',
        ),
      );
      return
    }

    const newUser = new User({
      name,
      email,
      photo: picture,
      emailVerified: email_verified,
      userType,
      status: "verified"
    });

    const newAccount = new Account({
      userId: newUser._id,
      provider: 'google',
      idToken: googleId,
    });

    await newUser.save({ session });
    await newAccount.save({ session });
    await session.commitTransaction();
    session.endSession();
    const accessToken = generateAccessToken({
      userId: newUser._id,
    });

    const refreshToken = generateRefreshToken({
      userId: newUser._id,
    });

    res.status(201).json(
      ApiResponse.success(
        {
          userDetails: user,
          accessToken,
          refreshToken,
          newRegistration: true
        },
        'Signup successful',
      ),
    );
    return
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
