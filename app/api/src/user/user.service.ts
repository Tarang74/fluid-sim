import HttpError from "../errors/HttpError";
import {
  SignUpCommand,
  ConfirmSignUpCommand,
  AuthFlowType,
  InitiateAuthCommand,
  UsernameExistsException,
  UserNotFoundException,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  GetUserCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  cognito,
  createSecretHash,
  emailTaken,
  getUser,
} from "../clients/cognito";
import { User } from "@tarang-and-tina/shared/dist/domain";
import { SESSION_EXPIRY } from "../routes/auth";
import { SECRETS } from "../clients/secrets";
import { PARAMETERS } from "../clients/parameters";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export async function signUpUser(
  username: string,
  email: string,
  password: string,
): Promise<void> {
  username = username.toLowerCase();
  email = email.toLowerCase();

  if (await emailTaken(email)) {
    throw new HttpError(400, "Email already in use");
  }

  const secretHash = createSecretHash(username);

  const command = new SignUpCommand({
    ClientId: SECRETS.COGNITO_CLIENT_ID,
    SecretHash: secretHash,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });

  try {
    await cognito.send(command);
  } catch (e: unknown) {
    if (e instanceof UsernameExistsException) {
      throw new HttpError(400, "Username already exists");
    } else {
      throw new HttpError(400, `Failed to create user: ${String(e)}`);
    }
  }
}

export async function confirmSignUpUser(
  username: string,
  confirmationCode: string,
): Promise<void> {
  username = username.toLowerCase();

  const secretHash = createSecretHash(username);

  const command = new ConfirmSignUpCommand({
    ClientId: SECRETS.COGNITO_CLIENT_ID,
    SecretHash: secretHash,
    Username: username,
    ConfirmationCode: confirmationCode,
  });

  try {
    await cognito.send(command);
  } catch (e: unknown) {
    throw new HttpError(
      400,
      `Failed to register user using confirmation code: ${String(e)}`,
    );
  }
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<
  | { idToken: string; accessToken: string; refreshToken: string }
  | { requiresMfa: true; session: string; user: User }
> {
  username = username.toLowerCase();

  const secretHash = createSecretHash(username);

  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
    ClientId: SECRETS.COGNITO_CLIENT_ID,
  });

  try {
    const cognitoResponse = await cognito.send(command);
    const authenticationResult = cognitoResponse.AuthenticationResult;

    if (authenticationResult) {
      const { IdToken, AccessToken, RefreshToken } = authenticationResult;
      if (!IdToken || !AccessToken || !RefreshToken) {
        throw new HttpError(400, "Could not retrieve tokens");
      }

      return {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      };
    } else if (
      cognitoResponse.ChallengeName === "SOFTWARE_TOKEN_MFA" &&
      cognitoResponse.Session
    ) {
      // MFA challenge required - create user object without tokens
      const userId =
        cognitoResponse.ChallengeParameters?.USER_ID_FOR_SRP || username;
      const user: User = {
        id: userId,
        username: username,
        email: "", // We'll get this after MFA verification
        mfaEnabled: true, // If we're here, MFA is enabled
        federated: false,
      };
      return {
        requiresMfa: true,
        session: cognitoResponse.Session,
        user: user,
      };
    } else {
      throw new HttpError(401, "Authentication Failed.");
    }
  } catch (e: unknown) {
    if (e instanceof UserNotFoundException) {
      throw new HttpError(400, "User not Found");
    } else {
      throw new HttpError(400, `Failed to login: ${String(e)}`);
    }
  }
}

export async function refreshTokens(
  idToken: string,
  accessToken: string,
  refreshToken: string,
): Promise<{ idToken: string; accessToken: string; user: User }> {
  try {
    const idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: SECRETS.COGNITO_USER_POOL_ID,
      tokenUse: "id",
      clientId: SECRETS.COGNITO_CLIENT_ID,
    });

    const idTokenPayload = await idTokenVerifier.verify(idToken);
    const user = await getUser(idToken, accessToken);

    if (idTokenPayload.exp > idTokenPayload.iat + SESSION_EXPIRY) {
      // if expired
      const secretHash = createSecretHash(user.username);

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: secretHash,
        },
        ClientId: SECRETS.COGNITO_CLIENT_ID,
      });

      const cognitoResponse = await cognito.send(command);
      const authenticationResult = cognitoResponse.AuthenticationResult;

      if (authenticationResult) {
        const { IdToken, AccessToken } = authenticationResult;
        if (!IdToken || !AccessToken) {
          throw new HttpError(400, "Could not retrieve tokens");
        }

        return {
          idToken: IdToken,
          accessToken: AccessToken,
          user,
        };
      } else {
        throw new HttpError(400, "Failed to regenerate tokens");
      }
    } else {
      return { idToken, accessToken, user };
    }
  } catch (err: unknown) {
    throw new HttpError(401, `Failed to verify id token: ${String(err)}`);
  }
}

export async function setupMfa(
  username: string,
  accessToken: string,
): Promise<{
  secretCode: string;
  qrCodeUrl: string;
}> {
  username = username.toLowerCase();

  try {
    const command = new AssociateSoftwareTokenCommand({
      AccessToken: accessToken,
    });

    const response = await cognito.send(command);

    if (!response.SecretCode) {
      throw new HttpError(400, "Failed to generate MFA secret");
    }

    // Generate QR code URL for authenticator apps
    const qrCodeUrl = `otpauth://totp/${username}?secret=${response.SecretCode}&issuer=Tarang%20and%20Tina`;

    return {
      secretCode: response.SecretCode,
      qrCodeUrl,
    };
  } catch (e: unknown) {
    throw new HttpError(400, `Failed to setup MFA: ${String(e)}`);
  }
}

export async function verifyMfaSetup(
  username: string,
  mfaCode: string,
  accessToken: string,
): Promise<boolean> {
  username = username.toLowerCase();

  try {
    const command = new VerifySoftwareTokenCommand({
      UserCode: mfaCode,
      AccessToken: accessToken,
    });

    const response = await cognito.send(command);
    return response.Status === "SUCCESS";
  } catch (e: unknown) {
    throw new HttpError(400, `Failed to verify MFA: ${String(e)}`);
  }
}

export async function verifyMfaChallenge(
  username: string,
  mfaCode: string,
  session: string,
): Promise<{ idToken: string; accessToken: string; refreshToken: string }> {
  username = username.toLowerCase();

  try {
    const command = new RespondToAuthChallengeCommand({
      ClientId: SECRETS.COGNITO_CLIENT_ID,
      ChallengeName: "SOFTWARE_TOKEN_MFA",
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        SOFTWARE_TOKEN_MFA_CODE: mfaCode,
        SECRET_HASH: createSecretHash(username),
      },
    });

    const response = await cognito.send(command);

    if (response.AuthenticationResult) {
      const { IdToken, AccessToken, RefreshToken } =
        response.AuthenticationResult;
      if (!IdToken || !AccessToken || !RefreshToken) {
        throw new HttpError(
          400,
          "Could not retrieve tokens after MFA verification",
        );
      }

      return {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      };
    } else {
      throw new HttpError(400, "MFA verification failed");
    }
  } catch (e: unknown) {
    throw new HttpError(400, `Failed to verify MFA challenge: ${String(e)}`);
  }
}

export async function setMfaActiveStatus(
  enabled: boolean,
  accessToken: string,
): Promise<boolean> {
  try {
    const command = new SetUserMFAPreferenceCommand({
      AccessToken: accessToken,
      SoftwareTokenMfaSettings: enabled
        ? {
            Enabled: true,
            PreferredMfa: true,
          }
        : {
            Enabled: false,
          },
    });

    await cognito.send(command);
    return enabled;
  } catch (e: unknown) {
    throw new HttpError(400, `Failed to toggle MFA: ${String(e)}`);
  }
}

export async function getMfaActiveStatus(
  accessToken: string,
): Promise<boolean> {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await cognito.send(command);

    // Check if user has MFA enabled
    const mfaEnabled =
      response.UserMFASettingList?.some(
        (setting) => setting === "SOFTWARE_TOKEN_MFA",
      ) || false;

    return mfaEnabled;
  } catch (e: unknown) {
    throw new HttpError(400, `Failed to get MFA status: ${String(e)}`);
  }
}

export async function handleCognitoHostedUI(
  code: string,
  uri: string,
): Promise<{
  idToken: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}> {
  try {
    const domain = `${PARAMETERS.COGNITO_USER_POOL_DOMAIN}.auth.${process.env.AWS_REGION}.amazoncognito.com`;
    const redirectUri = `${uri}/oauth/callback`;

    const tokenResponse = await fetch(`https://${domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: SECRETS.COGNITO_CLIENT_ID,
        client_secret: SECRETS.COGNITO_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new HttpError(
        502,
        `Failed to exchange authorization code: ${errorText}`,
      );
    }

    const tokens = (await tokenResponse.json()) as {
      id_token?: string;
      access_token?: string;
      refresh_token?: string;
    };

    const {
      id_token: idToken,
      access_token: accessToken,
      refresh_token: refreshToken,
    } = tokens;

    if (!idToken || !accessToken || !refreshToken) {
      throw new HttpError(502, "Could not retrieve tokens from Cognito");
    }

    // Get user information from the ID token
    const user = await getUser(idToken, accessToken, false);

    return {
      idToken,
      accessToken,
      refreshToken,
      user,
    };
  } catch (e: unknown) {
    throw new HttpError(400, `Cognito hosted UI login failed: ${String(e)}`);
  }
}
