import HttpError from "../errors/HttpError";
import { NextFunction, Request, Response } from "express";
import CookieMap from "../types/CookieMap";
import { userSessionKey } from "../clients/redis";
import Session from "../types/Session";
import { CLIENTS } from "../clients/clients";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { SECRETS } from "../clients/secrets";

export function jwtAuth<
  TParams = {},
  TResponseBody = unknown,
  TRequestBody = unknown,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
>(
  req: Request<TParams, TResponseBody, TRequestBody, TQuery>,
  res: Response<TResponseBody>,
  next: NextFunction,
) {
  // Skip OPTIONS for CORS preflight
  if (req.method === "OPTIONS") return res.status(204);

  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    return next(new HttpError(400, "Token cookies not found"));
  }

  const idTokenVerifier = CognitoJwtVerifier.create({
    userPoolId: SECRETS.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: SECRETS.COGNITO_CLIENT_ID,
  });

  CLIENTS.redis
    .get(userSessionKey(cookies.sessionId))
    .then((raw) => {
      if (!raw) throw new HttpError(400, "Could not find session tokens");

      const payload = JSON.parse(raw) as Session;
      return idTokenVerifier.verify(payload.idToken);
    })
    .then(() => {
      next();
    })
    .catch(next);
}
