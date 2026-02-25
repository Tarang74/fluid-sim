import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

interface Secrets {
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  COGNITO_USER_POOL_ID: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;
  POSTGRES_USERNAME: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DATABASE_NAME: string;
}
export let SECRETS: Secrets;

export async function loadSecrets() {
  const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });

  SECRETS = {
    COGNITO_CLIENT_ID:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    COGNITO_CLIENT_SECRET:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    COGNITO_USER_POOL_ID:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    REDIS_USERNAME:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    REDIS_PASSWORD:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    POSTGRES_USERNAME:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    POSTGRES_PASSWORD:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
    POSTGRES_DATABASE_NAME:
      (
        await sm.send(
          new GetSecretValueCommand({
            SecretId: "",
          }),
        )
      ).SecretString ?? "",
  };
}
