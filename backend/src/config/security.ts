const placeholders = ["placeholder", "changeme", "your-jwt", "replace-with"];

export const validateProductionJwtSecret = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.NODE_ENV !== "production") return;
  const secret = env.JWT_SECRET;
  const normalizedSecret = secret?.trim().toLowerCase();
  if (
    !secret ||
    Buffer.byteLength(secret, "utf8") < 32 ||
    normalizedSecret === "secret" ||
    placeholders.some((word) => normalizedSecret?.includes(word))
  ) {
    throw new Error("JWT_SECRET must be at least 32 bytes and non-placeholder in production");
  }
};
