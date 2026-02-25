export function signupRequest(
  username: string,
  email: string,
  password: string,
) {
  return Promise.resolve({});
  // return post<SignupResponseBody>(
  //   "/api/auth/signup",
  //   JSON.stringify({
  //     username,
  //     email,
  //     password,
  //   } as SignupRequestBody),
  // );
}

export function confirmSignupRequest(
  username: string,
  confirmationCode: string,
) {
  return Promise.resolve({});
  // return post<SignupResponseBody>(
  //   "/api/auth/signup/confirm",
  //   JSON.stringify({
  //     username,
  //     confirmationCode,
  //   } as ConfirmSignupRequestBody),
  // );
}

export function loginRequest(username: string, password: string) {
  return Promise.resolve({
    user: {
      id: "1",
      username: username,
      email: "demo@email.com",
      mfaEnabled: false,
      federated: false,
    },
    requiresMfa: false,
  });
  // return post<LoginResponseBody>(
  //   "/api/auth/login",
  //   JSON.stringify({ username, password } as LoginRequestBody),
  // );
}

export function refreshTokenRequest() {
  return Promise.resolve({
    user: {
      id: "1",
      username: "demo-user",
      email: "demo@email.com",
      mfaEnabled: false,
      federated: false,
    },
  });
  // return post<RefreshTokenResponseBody>("/api/auth/refresh", null);
}

export function logoutRequest() {
  return Promise.resolve({});
  // return post<LogoutResponseBody>("/api/auth/logout", null);
}

// MFA API functions
export function setupMfaRequest(username: string) {
  return Promise.resolve({
    secretCode: "secret-code",
    qrCodeUrl: "https://tarangjanawalkar.com/",
  });
  // return post<SetupMfaResponseBody>(
  //   "/api/auth/mfa/setup",
  //   JSON.stringify({ username } as SetupMfaRequestBody),
  // );
}

export function verifyMfaRequest(username: string, mfaCode: string) {
  return Promise.resolve({ success: true });
  // return post<VerifyMfaResponseBody>(
  //   "/api/auth/mfa/verify",
  //   JSON.stringify({ username, mfaCode } as VerifyMfaRequestBody),
  // );
}

export function verifyMfaChallengeRequest(
  username: string,
  mfaCode: string,
  session: string,
) {
  return Promise.resolve({
    user: {
      id: "1",
      username: username,
      email: "demo@email.com",
      mfaEnabled: false,
      federated: false,
    },
    requiresMfa: false,
    session: session,
  });
  // return post<LoginResponseBody>(
  //   "/api/auth/mfa/challenge",
  //   JSON.stringify({ username, mfaCode, session }),
  // );
}

export function setMfaRequest(enabled: boolean) {
  return Promise.resolve({ mfaEnabled: enabled });
  // return patch<SetMfaResponseBody>(
  //   "/api/auth/mfa",
  //   JSON.stringify({ enabled } as SetMfaRequestBody),
  // );
}

export function getMfaRequest() {
  return Promise.resolve({ mfaEnabled: true });
  // return get<GetMfaResponseBody>("/api/auth/mfa");
}

export function initiateGoogleLogin() {
  return Promise.resolve({ authUrl: "https://tarangjanawalkar.com/" });
  // const redirectUri = encodeURIComponent(
  //   window.location.origin + "/oauth/callback",
  // );
  // const state = encodeURIComponent(JSON.stringify({ provider: "google" }));
  //
  // const query: GetAuthUrlQuery = {
  //   redirectUri: redirectUri,
  //   state: state,
  // };
  // get<GetAuthUrlResponseBody>("/api/oauth/callback/url", undefined, query)
  //   .then((res) => {
  //     globalThis.window.location.href = res.authUrl;
  //     console.log(res.authUrl);
  //   })
  //   .catch((err: unknown) => {
  //     console.log("Auth URL failed:", err);
  //   });
}

export function cognitoCallbackRequest(code: string) {
  return Promise.resolve({
    user: {
      id: "1",
      username: "demo-user",
      email: "demo@email.com",
      mfaEnabled: false,
      federated: false,
    },
  });
  // return post<CognitoCallbackResponseBody>(
  //   "/api/oauth/cognito/callback",
  //   JSON.stringify({
  //     code,
  //     uri: window.location.origin,
  //   } as CognitoCallbackRequestBody),
  // );
}
