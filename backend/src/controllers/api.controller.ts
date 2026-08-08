import { Request, Response } from "express";
import {
  createApi,
  getApis,
  getApiById,
  updateApi,
  deleteApi,
} from "../services/api.service";

import asyncHandler from "../utils/asyncHandler";

type ApiParams = {
  id: string;
};

export const create = asyncHandler(async (req, res) => {
  const api = await createApi({
    ...req.body,
    ownerId: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    message: "API created successfully",
    data: api,
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const apis = await getApis(req.user!.userId);

  res.status(200).json({
    success: true,
    data: apis,
  });
});

export const getOne = asyncHandler(
  async (req: Request<ApiParams>, res: Response) => {
    const api = await getApiById(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      data: api,
    });
  },
);

export const update = asyncHandler(
  async (req: Request<ApiParams>, res: Response) => {
    const api = await updateApi(req.params.id, req.user!.userId, req.body);

    res.status(200).json({
      success: true,
      message: "API updated successfully",
      data: api,
    });
  },
);

export const remove = asyncHandler(
  async (req: Request<ApiParams>, res: Response) => {
    await deleteApi(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "API deleted successfully",
    });
  },
);
