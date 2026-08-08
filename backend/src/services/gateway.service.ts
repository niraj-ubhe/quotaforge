import { Request } from "express";
import axios, { AxiosError } from "axios";
import prisma from "../lib/prisma";
import { logRequest } from "./analytics.service";

type GatewayParams = {
  apiId: string;
  path: string[];
};

export const proxyRequest = async (req: Request<GatewayParams>) => {
  const { path } = req.params;

  const remainingPath = path.join("/");
  const targetUrl = `${req.api!.baseUrl}/${remainingPath}`;

  const startTime = Date.now();

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: undefined,
        "x-api-key": undefined,
      },
      params: req.query,
      data: req.body,
    });

    const responseTime = Date.now() - startTime;

    // Log successful request
    try {
      await logRequest({
        apiId: req.api!.apiId,
        apiKeyId: req.api!.apiKeyId,
        method: req.method,
        path: `/${remainingPath}`,
        statusCode: response.status,
        responseTime,
      });
    } catch (error) {
      console.error("Failed to log analytics:", error);
    }

    await prisma.apiKey.update({
      where: {
        id: req.api!.apiKeyId,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // If the target API responded with an error status
    if (error instanceof AxiosError && error.response) {
      try {
        await logRequest({
          apiId: req.api!.apiId,
          apiKeyId: req.api!.apiKeyId,
          method: req.method,
          path: `/${remainingPath}`,
          statusCode: error.response.status,
          responseTime,
        });
      } catch (analyticsError) {
        console.error("Failed to log analytics:", analyticsError);
      }

      return {
        status: error.response.status,
        data: error.response.data,
      };
    }

    // Target API did not respond at all
    try {
      await logRequest({
        apiId: req.api!.apiId,
        apiKeyId: req.api!.apiKeyId,
        method: req.method,
        path: `/${remainingPath}`,
        statusCode: 502,
        responseTime,
      });
    } catch (analyticsError) {
      console.error("Failed to log analytics:", analyticsError);
    }

    throw error;
  }
};
