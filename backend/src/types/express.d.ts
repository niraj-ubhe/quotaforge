import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };

      api?: {
        apiId: string;
        apiKeyId: string;
        baseUrl: string;
        requestsPerMinute: number;
        rateLimitAlgorithm: "FIXED_WINDOW" | "SLIDING_WINDOW" | "TOKEN_BUCKET";
      };
    }
  }
}

export {};
