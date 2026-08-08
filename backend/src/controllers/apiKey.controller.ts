import { Request, Response } from "express";
import {
  createApiKey,
  getApiKeys,
  updateApiKeyStatus,
} from "../services/apiKey.service";

import asyncHandler from "../utils/asyncHandler";

type ApiKeyParams = {
  id: string;
};

export const create = asyncHandler(async (req, res) => {
  const { apiId, name } = req.body;

  const apiKey = await createApiKey(apiId, req.user!.userId, name);

  res.status(201).json({
    success: true,
    message: "API key generated successfully",
    data: apiKey,
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const keys = await getApiKeys(req.user!.userId);

  res.status(200).json({
    success: true,
    data: keys,
  });
});

export const revoke = asyncHandler(async (req: Request<ApiKeyParams>, res) => {
  const apiKey = await updateApiKeyStatus(
    req.params.id,
    req.user!.userId,
    false,
  );

  res.json({
    success: true,
    message: "API key revoked successfully",
    data: apiKey,
  });
});

export const activate = asyncHandler(
  async (req: Request<ApiKeyParams>, res) => {
    const apiKey = await updateApiKeyStatus(
      req.params.id,
      req.user!.userId,
      true,
    );

    res.json({
      success: true,
      message: "API key activated successfully",
      data: apiKey,
    });
  },
);
