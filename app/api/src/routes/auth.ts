import { Router } from "express";
import {
  authenticateUser,
  signUpUser,
  confirmSignUpUser,
  refreshTokens,
  setupMfa,
  verifyMfaSetup,
  verifyMfaChallenge,
  setMfaActiveStatus,
  getMfaActiveStatus,
} from "../user/user.service";

import {
  ConfirmSignupRequestBody,
  ConfirmSignupResponseBody,
  SignupRequestBody,
  SignupResponseBody,
  LoginRequestBody,
  LoginResponseBody,
  LogoutResponseBody,
  RefreshTokenResponseBody,
  SetupMfaRequestBody,
  SetupMfaResponseBody,
  VerifyMfaRequestBody,
  VerifyMfaResponseBody,
  SetMfaRequestBody,
  SetMfaResponseBody,
  GetMfaRequestBody,
  GetMfaResponseBody,
} from "@tarang-and-tina/shared/dist/auth";
import { HTTPErrorResponse } from "@tarang-and-tina/shared/dist/api";

import { jwtAuth } from "../middleware/jwtAuth";
import CookieMap from "../types/CookieMap";
import HttpError from "../errors/HttpError";
import { getUser } from "../clients/cognito";
import { userSessionKey } from "../clients/redis";
import Session from "../types/Session";
import { CLIENTS } from "../clients/clients";
import { SimCache } from "../clients/simCache";

export const SESSION_EXPIRY = 60 * 60;
export const SESSION_REFRESH_EXPIRY = 60 * 60 * 24 * 7;

const authRoutes = Router();

authRoutes.post<
  "/signup",
  {},
  SignupResponseBody | HTTPErrorResponse,
  SignupRequestBody
>("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  await signUpUser(username, email, password);

  res.status(201).json({});
});

authRoutes.post<
  "/signup/confirm",
  {},
  ConfirmSignupResponseBody | HTTPErrorResponse,
  ConfirmSignupRequestBody
>("/signup/confirm", async (req, res) => {
  const { username, confirmationCode } = req.body;
  await confirmSignUpUser(username, confirmationCode);

  res.status(201).json({});
});

authRoutes.post<
  "/login",
  {},
  LoginResponseBody | HTTPErrorResponse,
  LoginRequestBody
>("/login", async (req, res) => {
  const { username, password } = req.body;
  const authResult = await authenticateUser(username, password);

  // Check if MFA is required
  if ("requiresMfa" in authResult && authResult.requiresMfa) {
    // Return MFA challenge info without setting cookies
    res.status(201).json({
      user: authResult.user,
      requiresMfa: true,
      session: authResult.session,
    });
  } else {
    // Normal login - set cookies and return user
    const { idToken, accessToken, refreshToken } = authResult as {
      idToken: string;
      accessToken: string;
      refreshToken: string;
    };

    const user = await getUser(idToken, accessToken);
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

    res.status(201).json({ user, requiresMfa: false });
  }
});

authRoutes.post<"/refresh", {}, RefreshTokenResponseBody>(
  "/refresh",
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { idToken, accessToken, user } = await refreshTokens(
      payload.idToken,
      payload.accessToken,
      payload.refreshToken,
    );

    if (payload.idToken !== idToken) {
      const payload2: Session = {
        userId: user.id,
        idToken,
        accessToken,
        refreshToken: payload.refreshToken,
      };
      await CLIENTS.redis.set(
        userSessionKey(cookies.sessionId),
        JSON.stringify(payload2),
        "EX",
        SESSION_REFRESH_EXPIRY,
      );

      res.cookie("sessionId", cookies.sessionId, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: SESSION_REFRESH_EXPIRY * 1000,
      });
    }
    res.status(200).json({ user });
  },
);

authRoutes.post<"/logout", {}, LogoutResponseBody>(
  "/logout",
  jwtAuth<{}, LogoutResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    await SimCache.invalidateSimList(payload.userId);
    await CLIENTS.redis.del(userSessionKey(cookies.sessionId));
    res.clearCookie("sessionId");
    res.status(201).json({});
  },
);

// Setup MFA
authRoutes.post<
  "/mfa/setup",
  {},
  SetupMfaResponseBody | HTTPErrorResponse,
  SetupMfaRequestBody
>("/mfa/setup", jwtAuth, async (req, res) => {
  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    throw new HttpError(400, "Token cookies not found");
  }
  const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
  if (!raw) {
    throw new HttpError(400, "Could not find session tokens");
  }
  const payload = JSON.parse(raw) as Session;

  const { username } = req.body;
  const result = await setupMfa(username, payload.accessToken);
  res.status(200).json(result);
});

// Verify MFA Setup
authRoutes.post<
  "/mfa/verify",
  {},
  VerifyMfaResponseBody | HTTPErrorResponse,
  VerifyMfaRequestBody
>("/mfa/verify", jwtAuth, async (req, res) => {
  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    throw new HttpError(400, "Token cookies not found");
  }
  const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
  if (!raw) {
    throw new HttpError(400, "Could not find session tokens");
  }
  const payload = JSON.parse(raw) as Session;

  const { username, mfaCode } = req.body;
  const success = await verifyMfaSetup(username, mfaCode, payload.accessToken);
  res.status(200).json({ success });
});

// Verify MFA Challenge (during login)
authRoutes.post<
  "/mfa/challenge",
  {},
  LoginResponseBody | HTTPErrorResponse,
  { username: string; mfaCode: string; session: string }
>("/mfa/challenge", async (req, res) => {
  const { username, mfaCode, session } = req.body;

  const { idToken, accessToken, refreshToken } = await verifyMfaChallenge(
    username,
    mfaCode,
    session,
  );

  const user = await getUser(idToken, accessToken);
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

  res.status(201).json({ user, requiresMfa: false });
});

// Set MFA Status
authRoutes.patch<
  "/mfa",
  {},
  SetMfaResponseBody | HTTPErrorResponse,
  SetMfaRequestBody
>("/mfa", jwtAuth, async (req, res) => {
  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    throw new HttpError(400, "Token cookies not found");
  }
  const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
  if (!raw) {
    throw new HttpError(400, "Could not find session tokens");
  }
  const payload = JSON.parse(raw) as Session;

  const { enabled } = req.body;
  const mfaEnabled = await setMfaActiveStatus(enabled, payload.accessToken);
  res.status(200).json({ mfaEnabled });
});

// Get MFA Status
authRoutes.get<
  "/mfa",
  {},
  GetMfaResponseBody | HTTPErrorResponse,
  GetMfaRequestBody
>("/mfa", jwtAuth, async (req, res) => {
  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    throw new HttpError(400, "Token cookies not found");
  }
  const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
  if (!raw) {
    throw new HttpError(400, "Could not find session tokens");
  }
  const payload = JSON.parse(raw) as Session;

  const mfaEnabled = await getMfaActiveStatus(payload.accessToken);
  res.status(200).json({ mfaEnabled });
});

export default authRoutes;
