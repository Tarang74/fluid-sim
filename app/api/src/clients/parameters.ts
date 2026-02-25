import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

interface Parameters {
  S3_RENDER_BUCKET: string;
  COGNITO_USER_POOL_DOMAIN: string;
}
export let PARAMETERS: Parameters;

export async function loadParameters() {
  const ssm = new SSMClient({ region: process.env.AWS_REGION });

  PARAMETERS = {
    S3_RENDER_BUCKET:
      (
        await ssm.send(
          new GetParameterCommand({
            Name: "",
          }),
        )
      ).Parameter?.Value ?? "",
    COGNITO_USER_POOL_DOMAIN:
      (
        await ssm.send(
          new GetParameterCommand({
            Name: "",
          }),
        )
      ).Parameter?.Value ?? "",
  };
}
