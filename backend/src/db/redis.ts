import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
})

redis.on('connect', () => {
  console.log('Redis connected')
})
redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})
redis.on('close', () => {
  console.warn('Redis disconnected')
})

export async function connectRedis() {
  await redis.connect()
}

export async function disconnectRedis() {
  await redis.quit()
}
