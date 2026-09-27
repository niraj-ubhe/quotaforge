import prisma from "../lib/prisma";
import NotFoundError from "../errors/NotFoundError";
import ForbiddenError from "../errors/ForbiddenError";
import { isDemoEmail } from "../config/demo";

const assertDemoAccountAllowsDelete = async (ownerId: string) => {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { email: true },
  });

  if (owner && isDemoEmail(owner.email)) {
    throw new ForbiddenError(
      "Demo account APIs cannot be deleted so the shared demo stays intact",
    );
  }
};

export const createApi = async (data: {
  name: string;
  description?: string;
  baseUrl: string;
  requestsPerMinute?: number;
  rateLimitAlgorithm?: "FIXED_WINDOW" | "SLIDING_WINDOW" | "TOKEN_BUCKET";
  ownerId: string;
}) => {
  const api = await prisma.api.create({
    data: {
      name: data.name,
      description: data.description,
      baseUrl: data.baseUrl,
      ownerId: data.ownerId,
      requestsPerMinute: data.requestsPerMinute,
      rateLimitAlgorithm: data.rateLimitAlgorithm,
    },
  });

  return api;
};

export const getApis = async (ownerId: string) => {
  return prisma.api.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getApiById = async (id: string, ownerId: string) => {
  return prisma.api.findFirst({
    where: {
      id,
      ownerId,
    },
  });
};

export const updateApi = async (
  id: string,
  ownerId: string,
  data: {
    name?: string;
    description?: string;
    baseUrl?: string;
    requestsPerMinute?: number;
    rateLimitAlgorithm?: "FIXED_WINDOW" | "SLIDING_WINDOW" | "TOKEN_BUCKET";
  },
) => {
  const api = await prisma.api.findFirst({
    where: {
      id,
      ownerId,
    },
  });

  if (!api) {
    throw new NotFoundError("API not found");
  }

  return prisma.api.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteApi = async (id: string, ownerId: string) => {
  await assertDemoAccountAllowsDelete(ownerId);

  return prisma.$transaction(async (tx) => {
    const api = await tx.api.findFirst({
      where: {
        id,
        ownerId,
      },
    });

    if (!api) {
      throw new NotFoundError("API not found");
    }

    // ApiRequest has restrictive foreign keys to both Api and ApiKey. Remove
    // the history first, then the keys, before deleting the owned API itself.
    await tx.apiRequest.deleteMany({ where: { apiId: id } });
    await tx.apiKey.deleteMany({ where: { apiId: id } });
    await tx.api.delete({ where: { id } });

    return api;
  });
};
