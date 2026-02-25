import { Router } from "express";
import { SESSION_REFRESH_EXPIRY } from "./auth";
import { PARAMETERS } from "../clients/parameters";
import { SECRETS } from "../clients/secrets";
import { handleCognitoHostedUI } from "../user/user.service";
import { CLIENTS } from "../clients/clients";
import { userSessionKey } from "../clients/redis";
import HttpError from "../errors/HttpError";
import {
  CognitoCallbackRequestBody,
  CognitoCallbackResponseBody,
  GetAuthUrlQuery,
  GetAuthUrlResponseBody,
} from "@tarang-and-tina/shared/dist/auth";
import { HTTPErrorResponse } from "@tarang-and-tina/shared/dist/api";

const oauthRoutes = Router();

// Auth URL for Google federated login
oauthRoutes.get<
  "/callback/url",
  {},
  GetAuthUrlResponseBody | HTTPErrorResponse,
  {},
  GetAuthUrlQuery
>("/callback/url", (req, res) => {
  const authUrl =
    `https://${PARAMETERS.COGNITO_USER_POOL_DOMAIN}.auth.${process.env.AWS_REGION}.amazoncognito.com/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${SECRETS.COGNITO_CLIENT_ID}&` +
    `redirect_uri=${req.query.redirectUri}&` +
    `state=${req.query.state}&` +
    `scope=openid+email+profile&` +
    `identity_provider=Google&` +
    `prompt=select_account`;

  console.log(authUrl);

  res.status(200).json({ authUrl });
});

// Cognito Hosted callback
oauthRoutes.post<
  "/cognito/callback",
  {},
  CognitoCallbackResponseBody | HTTPErrorResponse,
  CognitoCallbackRequestBody
>("/cognito/callback", async (req, res) => {
  const { code, uri } = req.body;

  try {
    const { idToken, accessToken, refreshToken, user } =
      await handleCognitoHostedUI(code, uri);

    const sessionId = crypto.randomUUID();
    const payload = { userId: user.id, idToken, accessToken, refreshToken };
    await CLIENTS.redis.set(
      userSessionKey(sessionId),
      JSON.stringify(payload),
      "EX",
      SESSION_REFRESH_EXPIRY,
    );

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: SESSION_REFRESH_EXPIRY * 1000,
    });
    res.status(201).json({ user });
  } catch (error) {
    throw new HttpError(
      400,
      `Cognito hosted UI login failed: ${String(error)}`,
    );
  }
});

export default oauthRoutes;
