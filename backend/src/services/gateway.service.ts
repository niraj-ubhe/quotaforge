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

      // Only forward safe/useful headers
      headers: {
        accept: req.headers.accept,
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },

      params: req.query,

      // GET and HEAD requests should not send a body
      data:
        req.method !== "GET" && req.method !== "HEAD"
          ? req.body
          : undefined,
    });

    const responseTime = Date.now() - startTime;

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

    // Target API responded with an HTTP error
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

    // Target API did not respond
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

    

    return {
      status: 502,
      data: {
        success: false,
        message: "Bad Gateway",
      },
    };
  }
};