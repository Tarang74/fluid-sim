const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({});

const SIMULATION_BUCKET = process.env.SIMULATION_BUCKET;

exports.handler = async (event) => {
  console.log(`Processing ${event.Records.length} S3 events`);

  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing render: ${key}`);

    const filename = key.split("/").pop();

    // <simid>-<timestamp>-<frameid>.png
    const match = filename.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-(\d{5})\.png$/,
    );

    if (!match) {
      console.error(`Invalid filename format: ${filename}`);
      continue;
    }

    const timestamp = match[1]; // "2025-10-30T20-52-10Z"
    const frameid = match[2]; // "00001"

    const simulationKey = `${timestamp}/${frameid}.json`;

    console.log(`Deleting simulation data: ${simulationKey}`);

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: SIMULATION_BUCKET,
          Key: simulationKey,
        }),
      );

      console.log(`Successfully deleted ${simulationKey}`);
    } catch (error) {
      console.error(`Failed to delete ${simulationKey}:`, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: event.Records.length }),
  };
};
