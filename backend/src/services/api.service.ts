import prisma from "../lib/prisma";
import NotFoundError from "../errors/NotFoundError";

export const createApi = async (data: {
  name: string;
  description?: string;
  baseUrl: string;
  ownerId: string;
}) => {
  const api = await prisma.api.create({
    data: {
      name: data.name,
      description: data.description,
      baseUrl: data.baseUrl,
      ownerId: data.ownerId,
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
  const api = await prisma.api.findFirst({
    where: {
      id,
      ownerId,
    },
  });

  if (!api) {
    throw new NotFoundError("API not found");
  }

  await prisma.api.delete({
    where: {
      id,
    },
  });

  return api;
};
