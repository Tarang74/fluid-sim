import Redis from "ioredis";
import { SECRETS } from "./secrets";
import { PrismaClient } from "../../prisma/generated/prisma";
import { DefaultArgs } from "../../prisma/generated/prisma/runtime/library";
import { S3Client } from "@aws-sdk/client-s3";

interface Clients {
  redis: Redis;
  prisma: PrismaClient<
    {
      datasourceUrl: string;
    },
    never,
    DefaultArgs
  >;
  s3: S3Client;
}
export let CLIENTS: Clients;

export function loadClients() {
  const REDIS_DATABASE_URL =
    process.env.NODE_ENV === "production"
      ? `rediss://${SECRETS.REDIS_USERNAME}:${SECRETS.REDIS_PASSWORD}@${process.env.REDIS_ELASTICACHE_ENDPOINT!}:${process.env.REDIS_ELASTICACHE_PORT!}/0`
      : `redis://${SECRETS.REDIS_USERNAME}:${SECRETS.REDIS_PASSWORD}@${process.env.REDIS_ELASTICACHE_ENDPOINT!}:${process.env.REDIS_ELASTICACHE_PORT!}/0`;
  const POSTGRES_DATABASE_URL = `postgresql://${SECRETS.POSTGRES_USERNAME}:${SECRETS.POSTGRES_PASSWORD}@${process.env.POSTGRES_PRIVATE_IP!}:${process.env.POSTGRES_PORT_HOST!}/${SECRETS.POSTGRES_DATABASE_NAME}`;

  console.log(`Redis server: ${REDIS_DATABASE_URL}`);
  console.log(`Postgres server: ${POSTGRES_DATABASE_URL}`);

  const redis = new Redis({
    host: process.env.REDIS_ELASTICACHE_ENDPOINT!,
    port: Number(process.env.REDIS_ELASTICACHE_PORT!),
    username: SECRETS.REDIS_USERNAME,
    password: SECRETS.REDIS_PASSWORD,
    db: 0,
    ...(process.env.NODE_ENV === "production" && { tls: {} }),
  });
  const prisma = new PrismaClient({
    datasourceUrl: POSTGRES_DATABASE_URL,
  });
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
  });

  CLIENTS = { redis, prisma, s3 };
}
