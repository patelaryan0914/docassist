import type { NextFunction, Request, Response } from "express";
import { z, type ZodObject, type ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const zodError = result.error as ZodError;

        const errors = zodError.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        throw ApiError.badRequest(errors[0]?.message!, {
          validationErrors: errors,
        });
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
