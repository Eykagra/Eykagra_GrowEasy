import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError
    ? err.message
    : err.message || "An unexpected error occurred";

  console.error(`[Error] ${statusCode}: ${message}`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}