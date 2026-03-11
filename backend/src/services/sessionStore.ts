import { redis } from '../db/redis'

const SESSION_TTL = parseInt(process.env.SESSION_TTL ?? '604800', 10)         // 7d
const REFRESH_TTL = parseInt(process.env.REFRESH_TTL ?? '2592000', 10)        // 30d

export interface SessionData {
  userId: string
  email: string
  provider: string
  refreshToken: string
}

function sessionKey(userId: string) { return `session:${userId}` }
function refreshKey(userId: string) { return `refresh:${userId}` }

export async function setSession(userId: string, data: SessionData): Promise<void> {
  await redis.set(sessionKey(userId), JSON.stringify(data), 'EX', SESSION_TTL)
}

export async function getSession(userId: string): Promise<SessionData | null> {
  const raw = await redis.get(sessionKey(userId))
  if (!raw) return null
  return JSON.parse(raw) as SessionData
}

export async function deleteSession(userId: string): Promise<void> {
  await redis.del(sessionKey(userId))
}

// [65] Refresh token storage
export async function setRefreshToken(userId: string, token: string): Promise<void> {
  await redis.set(refreshKey(userId), token, 'EX', REFRESH_TTL)
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  return redis.get(refreshKey(userId))
}

export async function deleteRefreshToken(userId: string): Promise<void> {
  await redis.del(refreshKey(userId))
}
