import redis from "../../lib/redis";

const slidingWindowScript = `
local key = KEYS[1]

local limit = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local member = ARGV[4]

-- Remove requests outside the window
redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)

-- Count requests still inside the window
local currentRequests = redis.call("ZCARD", key)

-- Limit reached
if currentRequests >= limit then
    return 0
end

-- Add current request
redis.call("ZADD", key, now, member)

-- Keep the Redis key temporary
redis.call("EXPIRE", key, 60)

return 1
`;

export const slidingWindow = async (
  key: string,
  limit: number,
  windowSeconds: number,
) => {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const member = `${now}-${Math.random()}`;

  const result = await redis.eval(
    slidingWindowScript,
    [key],
    [limit, windowStart, now, member],
  );

  return result === 1;
};
