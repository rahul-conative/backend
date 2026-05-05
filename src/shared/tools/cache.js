const { redis } = require("../../infrastructure/redis/redis-client");

async function remember(key, ttlSeconds, fetcher) {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue);
  }

  const value = await fetcher();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return value;
}

module.exports = { remember };
