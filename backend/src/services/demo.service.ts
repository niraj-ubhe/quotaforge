import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { RateLimitAlgorithm } from "@prisma/client";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "../config/demo";
import { createApiKey } from "./apiKey.service";

type DemoApiSeed = {
  name: string;
  description: string;
  baseUrl: string;
  requestsPerMinute: number;
  rateLimitAlgorithm: RateLimitAlgorithm;
  paths: string[];
};

const DEMO_APIS: DemoApiSeed[] = [
  {
    name: "Niraj Pay",
    description: "Demo payments catalog backed by JSONPlaceholder.",
    baseUrl: "https://jsonplaceholder.typicode.com",
    requestsPerMinute: 60,
    rateLimitAlgorithm: "FIXED_WINDOW",
    paths: ["/posts", "/posts/1", "/posts/2"],
  },
  {
    name: "HTTPBin Demo",
    description: "HTTP diagnostics API for inspecting gateway traffic.",
    baseUrl: "https://httpbin.org",
    requestsPerMinute: 45,
    rateLimitAlgorithm: "SLIDING_WINDOW",
    paths: ["/get", "/status/200", "/headers"],
  },
  {
    name: "Demo User Service",
    description: "Sample user directory for tenant isolation demos.",
    baseUrl: "https://jsonplaceholder.typicode.com",
    requestsPerMinute: 30,
    rateLimitAlgorithm: "TOKEN_BUCKET",
    paths: ["/users", "/users/1", "/users/2"],
  },
  {
    name: "Demo Comments Service",
    description: "Comment feed used to compare fixed-window rate limits.",
    baseUrl: "https://jsonplaceholder.typicode.com",
    requestsPerMinute: 80,
    rateLimitAlgorithm: "FIXED_WINDOW",
    paths: ["/comments", "/comments/1", "/posts/1/comments"],
  },
  {
    name: "Weather API",
    description: "Open-Meteo forecast proxy for sliding-window limits.",
    baseUrl: "https://api.open-meteo.com",
    requestsPerMinute: 50,
    rateLimitAlgorithm: "SLIDING_WINDOW",
    paths: ["/v1/forecast", "/v1/forecast?latitude=52.52&longitude=13.41"],
  },
];

const MIN_DEMO_REQUESTS = 20;

export const ensureDemoUser = async () => {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });

  if (existing) {
    return existing;
  }

  const password =
    process.env.DEMO_USER_PASSWORD || crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    return await prisma.user.create({
      data: {
        name: DEMO_USER_NAME,
        email: DEMO_USER_EMAIL,
        password: hashedPassword,
      },
    });
  } catch {
    const raced = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
    });

    if (raced) {
      return raced;
    }

    throw new Error("Failed to create demo user");
  }
};

const buildDemoRequests = (
  apiId: string,
  apiKeyId: string,
  paths: string[],
) => {
  const now = Date.now();
  const statuses = [200, 200, 200, 201, 200, 429, 200, 404, 401, 200];
  const methods = ["GET", "GET", "POST", "GET"];
  const records = [];

  for (let i = 0; i < 36; i++) {
    const hoursAgo = Math.floor((i / 36) * 24 * 6);
    records.push({
      apiId,
      apiKeyId,
      method: methods[i % methods.length],
      path: paths[i % paths.length],
      statusCode: statuses[i % statuses.length],
      responseTime: 18 + (i % 12) * 9,
      createdAt: new Date(now - hoursAgo * 60 * 60 * 1000 - (i % 19) * 45000),
    });
  }

  return records;
};

export const ensureDemoData = async (ownerId: string) => {
  for (const seed of DEMO_APIS) {
    let api = await prisma.api.findFirst({
      where: {
        ownerId,
        name: seed.name,
      },
    });

    if (!api) {
      api = await prisma.api.create({
        data: {
          name: seed.name,
          description: seed.description,
          baseUrl: seed.baseUrl,
          ownerId,
          requestsPerMinute: seed.requestsPerMinute,
          rateLimitAlgorithm: seed.rateLimitAlgorithm,
        },
      });
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: { apiId: api.id },
      select: { id: true },
    });

    if (!existingKey) {
      await createApiKey(api.id, ownerId, `${seed.name} Key`);
    }
  }

  const requestCount = await prisma.apiRequest.count({
    where: {
      api: { ownerId },
    },
  });

  if (requestCount >= MIN_DEMO_REQUESTS) {
    return;
  }

  const apis = await prisma.api.findMany({
    where: { ownerId },
    include: {
      keys: {
        select: { id: true },
        take: 1,
      },
    },
  });

  const records = apis.flatMap((api) => {
    const keyId = api.keys[0]?.id;
    if (!keyId) {
      return [];
    }

    const seed = DEMO_APIS.find((item) => item.name === api.name);
    const paths = seed?.paths ?? ["/"];
    return buildDemoRequests(api.id, keyId, paths);
  });

  if (records.length) {
    await prisma.apiRequest.createMany({ data: records });
  }
};
