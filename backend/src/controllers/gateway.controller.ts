import { Request, Response } from "express";
import { AxiosError } from "axios";

import asyncHandler from "../utils/asyncHandler";
import { proxyRequest } from "../services/gateway.service";

type GatewayParams = {
  apiId: string;
  path: string[];
};

export const proxy = asyncHandler(
  async (req: Request<GatewayParams>, res: Response) => {
    try {
      const response = await proxyRequest(req);

      res.status(response.status).json(response.data);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      throw error;
    }
  },
);
