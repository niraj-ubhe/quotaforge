import { z } from "zod";

export const createApiSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "API name must be at least 3 characters")
    .max(100, "API name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  baseUrl: z.url({
    error: "Base URL must be a valid URL",
  }),
});

export const updateApiSchema = createApiSchema.partial();