import jwt from "jsonwebtoken";

export const generateAccessToken = (data: any) => {
  return jwt.sign(data, process.env.ACCESS_JWT_SECRET!, {
    expiresIn: process.env.ACCESS_JWT_EXPIRES_IN! as any,
  });
};

export const decodeAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_JWT_SECRET!);
};

export const generateRefreshToken = (data: any) => {
  return jwt.sign(data, process.env.REFRESH_JWT_SECRET!, {
    expiresIn: process.env.REFRESH_JWT_EXPIRES_IN! as any,
  });
};

export const decodeRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_JWT_SECRET!);
};
