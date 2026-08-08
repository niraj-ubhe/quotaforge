import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import {
  getOverview,
  getApiAnalytics,
  getTopEndpoints,
  getStatusCodes,
} from "../services/analytics.service";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const data = await getOverview(req.user!.userId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const apiAnalytics = asyncHandler(
  async (req: Request<{ apiId: string }>, res: Response) => {
    const data = await getApiAnalytics(req.params.apiId, req.user!.userId);

    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const topEndpoints = asyncHandler(
  async (req: Request<{ apiId: string }>, res: Response) => {
    const data = await getTopEndpoints(req.params.apiId, req.user!.userId);

    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const statusCodes = asyncHandler(
  async (req: Request<{ apiId: string }>, res: Response) => {
    const data = await getStatusCodes(req.params.apiId, req.user!.userId);

    res.status(200).json({
      success: true,
      data,
    });
  },
);
