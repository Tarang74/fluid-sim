import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { User } from "@tarang-and-tina/shared/dist/domain";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import crypto from "crypto";
import { getMfaActiveStatus } from "../user/user.service";
import { SECRETS } from "./secrets";

export const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

export function createSecretHash(username: string): string {
  const hmac = crypto.createHmac("sha256", SECRETS.COGNITO_CLIENT_SECRET);
  hmac.update(`${username}${SECRETS.COGNITO_CLIENT_ID}`);
  return hmac.digest("base64");
}

export async function getUser(
  idToken: string,
  accessToken: string,
  checkMfa: boolean = true,
): Promise<User> {
  const idTokenVerifier = CognitoJwtVerifier.create({
    userPoolId: SECRETS.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: SECRETS.COGNITO_CLIENT_ID,
  });

  const idTokenPayload = await idTokenVerifier.verify(idToken);

  const federatedIdentity = idTokenPayload.identities;
  if (federatedIdentity && federatedIdentity.length > 0) {
    const id = idTokenPayload.sub;
    const username = idTokenPayload.preferred_username as string;
    const email = idTokenPayload.email as string;
    const mfaEnabled = false;

    return { id, username, email, mfaEnabled, federated: true };
  } else {
    const id = idTokenPayload.sub;
    const username = idTokenPayload["cognito:username"];
    const email = idTokenPayload.email as string;
    const mfaEnabled = checkMfa ? await getMfaActiveStatus(accessToken) : false;

    return { id, username, email, mfaEnabled, federated: false };
  }
}

export async function emailTaken(email: string): Promise<boolean> {
  email = email.trim().toLowerCase();
  const command = new ListUsersCommand({
    UserPoolId: SECRETS.COGNITO_USER_POOL_ID,
    Filter: `email = "${email}"`,
    Limit: 1,
  });

  const res = await cognito.send(command);
  return (res.Users?.length ?? 0) > 0;
}
