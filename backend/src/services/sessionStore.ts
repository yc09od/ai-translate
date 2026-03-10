import { redis } from '../db/redis'

const SESSION_TTL = 7 * 24 * 60 * 60 // 7 days in seconds

export interface SessionData {
  userId: string
  email: string
  provider: string
}

function key(userId: string) {
  return `session:${userId}`
}

export async function setSession(userId: string, data: SessionData): Promise<void> {
  await redis.set(key(userId), JSON.stringify(data), 'EX', SESSION_TTL)
}

export async function getSession(userId: string): Promise<SessionData | null> {
  const raw = await redis.get(key(userId))
  if (!raw) return null
  return JSON.parse(raw) as SessionData
}

export async function deleteSession(userId: string): Promise<void> {
  await redis.del(key(userId))
}
