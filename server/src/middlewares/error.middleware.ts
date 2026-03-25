import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

export const error = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logData: any = {
    statusCode: err.statusCode || 500,
    status: err.status || "error",
    message: err.message || "Something went wrong!",
    metadata: err.metadata,
  };

  if (process.env.NODE_ENV === "development") {
    logData.stack = err.stack;
  }
  req.logger.error("ERROR", logData);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";
  let metadata = err.metadata;

  // if (err.code === 11000) {
  //     const field = Object.keys(err.keyValue)[0];
  //     const value = err.keyValue[field];
  //     message = `Duplicate field value: '${value}'. Please use another value!`;
  //     statusCode = 400;
  //     metadata = { field };
  // } else if (err.name === "ValidationError") {
  //     const validationErrors = Object.values(err.errors).map((el: any) => ({
  //         field: el.path,
  //         message: el.message,
  //     }));
  //     message = "Validation failed";
  //     statusCode = 400;
  //     metadata = { validationErrors };
  // } else if (err.name === "JsonWebTokenError") {
  //     message = "Invalid token. Please log in again!";
  //     statusCode = 401;
  //     metadata = { code: "INVALID_TOKEN" };
  // } else if (err.name === "TokenExpiredError") {
  //     message = "Your token has expired! Please log in again.";
  //     statusCode = 401;
  //     metadata = { code: "TOKEN_EXPIRED" };
  // }

  // Use ApiResponse to generate the final JSON response object

  const errorResponse = new ApiError(message, statusCode, metadata);

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
    {
      path: req.originalUrl,
      method: req.method,
    }
  );
  next(error);
};
