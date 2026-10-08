import { z } from "zod";

const email = z.string().trim().max(254).email().transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password cannot exceed 72 bytes");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password cannot exceed 72 bytes"),
});
