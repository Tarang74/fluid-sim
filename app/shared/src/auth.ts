import type { ApiRequest, ApiResponse } from "./api";
import type { User } from "./domain";

// Login
export interface LoginResponseBody {
  user: User;
  requiresMfa: boolean;
  session?: string;
}
export interface LoginRequestBody {
  username: string;
  password: string;
}
export type LoginRequest = ApiRequest<{}, LoginResponseBody, LoginRequestBody>;
export type LoginResponse = ApiResponse<LoginResponseBody>;

// Signup
export interface SignupResponseBody {}
export interface SignupRequestBody {
  username: string;
  email: string;
  password: string;
}
export type SignupRequest = ApiRequest<
  {},
  SignupResponseBody,
  SignupRequestBody
>;
export type SignupResponse = ApiResponse<SignupResponseBody>;

// Confirm signup
export interface ConfirmSignupResponseBody {}
export interface ConfirmSignupRequestBody {
  username: string;
  confirmationCode: string;
}
export type ConfirmSignupRequest = ApiRequest<
  {},
  ConfirmSignupResponseBody,
  ConfirmSignupRequestBody
>;
export type ConfirmSignupResponse = ApiResponse<ConfirmSignupResponseBody>;

// Token refresh
export interface RefreshTokenResponseBody {
  user: User;
}
export type RefreshTokenRequest = ApiRequest<{}, RefreshTokenResponseBody>;
export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseBody>;

// Logout
export interface LogoutResponseBody {}
export type LogoutRequest = ApiRequest<{}, LogoutResponseBody>;
export type LogoutResponse = ApiResponse<LogoutResponseBody>;

// MFA Setup
export interface SetupMfaResponseBody {
  secretCode: string;
  qrCodeUrl: string;
}
export interface SetupMfaRequestBody {
  username: string;
}
export type SetupMfaRequest = ApiRequest<
  {},
  SetupMfaResponseBody,
  SetupMfaRequestBody
>;
export type SetupMfaResponse = ApiResponse<SetupMfaResponseBody>;

// MFA Verification
export interface VerifyMfaResponseBody {
  success: boolean;
}
export interface VerifyMfaRequestBody {
  username: string;
  mfaCode: string;
}
export type VerifyMfaRequest = ApiRequest<
  {},
  VerifyMfaResponseBody,
  VerifyMfaRequestBody
>;
export type VerifyMfaResponse = ApiResponse<VerifyMfaResponseBody>;

// Update MFA State
export interface SetMfaResponseBody {
  mfaEnabled: boolean;
}
export interface SetMfaRequestBody {
  enabled: boolean;
}
export type SetMfaRequest = ApiRequest<
  {},
  SetMfaResponseBody,
  SetMfaRequestBody
>;
export type SetMfaResponse = ApiResponse<SetMfaResponseBody>;

// Get MFA State
export interface GetMfaResponseBody {
  mfaEnabled: boolean;
}
export interface GetMfaRequestBody {}
export type GetMfaRequest = ApiRequest<
  {},
  GetMfaResponseBody,
  GetMfaRequestBody
>;
export type GetMfaResponse = ApiResponse<GetMfaResponseBody>;

// Auth URL for Google federated login
export interface GetAuthUrlResponseBody {
  authUrl: string;
}
export interface GetAuthUrlQuery
  extends Record<string, string | number | undefined> {
  redirectUri: string;
  state: string;
}
export type GetAuthUrlRequest = ApiRequest<
  {},
  GetAuthUrlResponseBody,
  {},
  GetAuthUrlQuery
>;
export type GetAuthUrlResponse = ApiResponse<GetAuthUrlResponseBody>;

// Cognito Callback
export interface CognitoCallbackResponseBody {
  user: User;
}
export interface CognitoCallbackRequestBody {
  code: string;
  uri: string;
}
export type CognitoCallbackRequest = ApiRequest<
  {},
  CognitoCallbackResponseBody,
  CognitoCallbackRequestBody
>;
export type CognitoCallbackResponse = ApiResponse<CognitoCallbackResponseBody>;
