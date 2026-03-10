import { redis } from '../db/redis'

const USER_CACHE_TTL = parseInt(process.env.USER_CACHE_TTL ?? '3600', 10)

export interface CachedUser {
  id: string
  email: string
  name: string
  provider: string
  createdAt: string
}

function key(userId: string) {
  return `user:${userId}`
}

export async function setUserCache(user: CachedUser): Promise<void> {
  await redis.set(key(user.id), JSON.stringify(user), 'EX', USER_CACHE_TTL)
}

export async function getUserCache(userId: string): Promise<CachedUser | null> {
  const raw = await redis.get(key(userId))
  if (!raw) return null
  return JSON.parse(raw) as CachedUser
}

export async function deleteUserCache(userId: string): Promise<void> {
  await redis.del(key(userId))
}
