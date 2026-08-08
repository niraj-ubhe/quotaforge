import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await registerUser({
    name,
    email,
    password,
  });

  res.status(200).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});