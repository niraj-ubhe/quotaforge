import { z } from "zod";

export const createApiKeySchema = z.object({
  apiId: z.string().min(1, "API ID is required"),

  name: z
    .string()
    .trim()
    .min(3, "Key name must be at least 3 characters")
    .max(50, "Key name cannot exceed 50 characters"),
});