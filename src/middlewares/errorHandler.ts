import { NextFunction, Request, Response } from "express";

/**
 * Centralized error-handling middleware for Express.
 */
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message;
  const errors = undefined;

  res.status(statusCode).json({
    message,
    ...(errors ? { errors } : {}),
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
