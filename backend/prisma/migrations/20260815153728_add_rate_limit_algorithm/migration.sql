-- CreateEnum
CREATE TYPE "RateLimitAlgorithm" AS ENUM ('FIXED_WINDOW', 'SLIDING_WINDOW', 'TOKEN_BUCKET');

-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "rateLimitAlgorithm" "RateLimitAlgorithm" NOT NULL DEFAULT 'FIXED_WINDOW';
