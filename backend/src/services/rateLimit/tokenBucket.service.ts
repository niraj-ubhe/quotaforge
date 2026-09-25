import redis from "../../lib/redis";

const tokenBucketScript = `
local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local tokens = redis.call("HGET", key, "tokens")
local lastRefill = redis.call("HGET", key, "lastRefill")

-- First request
if not tokens or not lastRefill then
    redis.call("HSET", key,
        "tokens", capacity - 1,
        "lastRefill", now
    )

    redis.call("EXPIRE", key, 60)

    return 1
end

-- Calculate refilled tokens

local currentTokens = tonumber(tokens)
local previousRefill = tonumber(lastRefill)

local elapsedSeconds = (now - previousRefill) / 1000

local tokensToAdd = elapsedSeconds * refillRate

local newTokens = math.min(
    capacity,
    currentTokens + tokensToAdd
)

-- Not enough tokens
if newTokens < 1 then
    redis.call("HSET", key,
        "tokens", newTokens,
        "lastRefill", now
    )

    redis.call("EXPIRE", key, 60)

    return 0
end

-- Consume one token
local remainingTokens = newTokens - 1

redis.call("HSET", key,
    "tokens", remainingTokens,
    "lastRefill", now
)

redis.call("EXPIRE", key, 60)

return 1
`;

export const tokenBucket = async (
  key: string,
  capacity: number,
  refillRate: number,
) => {
  const now = Date.now();

  const result = await redis.eval(
    tokenBucketScript,
    [key],
    [capacity, refillRate, now],
  );

  return result === 1;
};
