import prisma from "../lib/prisma";

type LogRequestData = {
  apiId: string;
  apiKeyId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
};

export const logRequest = async (data: LogRequestData) => {
  return prisma.apiRequest.create({
    data: {
      apiId: data.apiId,
      apiKeyId: data.apiKeyId,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
    },
  });
};

export const getOverview = async (ownerId: string) => {
  const result = await prisma.apiRequest.aggregate({
    where: {
      api: {
        ownerId,
      },
    },
    _count: {
      id: true,
    },
    _avg: {
      responseTime: true,
    },
  });

  const totalRequests = result._count.id;
  const averageResponseTime = result._avg.responseTime ?? 0;

  const successfulRequests = await prisma.apiRequest.count({
    where: {
      api: {
        ownerId,
      },
      statusCode: {
        gte: 200,
        lt: 400,
      },
    },
  });

  const failedRequests = totalRequests - successfulRequests;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
  };
};

export const getApiAnalytics = async (apiId: string, ownerId: string) => {
  const result = await prisma.apiRequest.aggregate({
    where: {
      apiId,
      api: {
        ownerId,
      },
    },
    _count: {
      id: true,
    },
    _avg: {
      responseTime: true,
    },
  });

  const totalRequests = result._count.id;
  const averageResponseTime = result._avg.responseTime ?? 0;

  const successfulRequests = await prisma.apiRequest.count({
    where: {
      apiId,
      api: {
        ownerId,
      },
      statusCode: {
        gte: 200,
        lt: 400,
      },
    },
  });

  const failedRequests = totalRequests - successfulRequests;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
  };
};

export const getTopEndpoints = async (apiId: string, ownerId: string) => {
  const result = await prisma.apiRequest.groupBy({
    by: ["path"],
    where: {
      apiId,
      api: {
        ownerId,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  return result.map((item) => ({
    path: item.path,
    requests: item._count.id,
  }));
};

export const getStatusCodes = async (apiId: string, ownerId: string) => {
  const result = await prisma.apiRequest.groupBy({
    by: ["statusCode"],
    where: {
      apiId,
      api: {
        ownerId,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      statusCode: "asc",
    },
  });

  return result.map((item) => ({
    statusCode: item.statusCode,
    requests: item._count.id,
  }));
};
