import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import NotFoundError from "../errors/NotFoundError";


export const createApiKey = async (
  apiId: string,
  ownerId: string,
  name: string,
) => {
  // Verify the API belongs to the logged-in user
  const api = await prisma.api.findFirst({
    where: {
      id: apiId,
      ownerId,
    },
  });

  if (!api) {
    throw new Error("API not found");
  }

  const prefix =
    "qf_live_" + crypto.randomBytes(2).toString("hex").toUpperCase();

  const secret = crypto.randomBytes(32).toString("hex");

  const rawKey = `${prefix}.${secret}`;

  const keyHash = await bcrypt.hash(secret, 10);

  await prisma.apiKey.create({
    data: {
      name,
      prefix,
      keyHash,
      apiId,
    },
  });

  // Return the original key only once
  return {
    key: rawKey,
  };
};

export const getApiKeys = async (ownerId: string) => {
  return prisma.apiKey.findMany({
    where: {
      api: {
        ownerId,
      },
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      apiId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateApiKeyStatus = async (
  id: string,
  ownerId: string,
  isActive: boolean,
) => {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      api: {
        ownerId,
      },
    },
  });

  if (!apiKey) {
    throw new NotFoundError("API not found");
  }

  return prisma.apiKey.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
    },
  });
};
