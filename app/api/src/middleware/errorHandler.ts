import type { ErrorRequestHandler } from "express";
import HttpError from "../errors/HttpError";

export const errorHandler = (): ErrorRequestHandler => {
  return (err, _req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    } else if (err instanceof Error) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return next();
    }
  };
};
