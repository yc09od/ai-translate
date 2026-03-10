import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { findByEmail, createUser } from '../services/userService'
import { setSession, deleteSession } from '../services/sessionStore'

async function verifyGoogleToken(token: string): Promise<{ email: string; name: string }> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
  if (!res.ok) throw new Error('Invalid Google token')
  const data = (await res.json()) as { email: string; name: string }
  return { email: data.email, name: data.name }
}

async function verifyMicrosoftToken(token: string): Promise<{ email: string; name: string }> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Invalid Microsoft token')
  const data = (await res.json()) as {
    mail?: string
    userPrincipalName?: string
    displayName: string
  }
  return { email: (data.mail || data.userPrincipalName)!, name: data.displayName }
}

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/oauth — OAuth 登录
  fastify.post('/auth/oauth', async (request: FastifyRequest, reply: FastifyReply) => {
    const { provider, oauthToken } = request.body as {
      provider: 'google' | 'hotmail'
      oauthToken: string
    }

    if (!provider || !oauthToken) {
      return reply.status(400).send({ error: 'provider and oauthToken are required' })
    }

    let email: string
    let name: string

    if (provider === 'google') {
      ;({ email, name } = await verifyGoogleToken(oauthToken))
    } else if (provider === 'hotmail') {
      ;({ email, name } = await verifyMicrosoftToken(oauthToken))
    } else {
      return reply.status(400).send({ error: 'Invalid provider, must be google or hotmail' })
    }

    let user = await findByEmail(email)
    if (!user) {
      user = await createUser({ email, name, provider })
    }

    const userId = (user._id as { toString(): string }).toString()
    const token = fastify.jwt.sign({ userId, email, provider }, { expiresIn: '7d' })
    await setSession(userId, { userId, email, provider })

    return { token }
  })

  // POST /auth/logout — 登出，删除 Redis session
  fastify.post(
    '/auth/logout',
    { onRequest: [(fastify as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { userId: string }
      await deleteSession(user.userId)
      return { success: true }
    }
  )
}
