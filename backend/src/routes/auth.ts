import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { findByEmail, createUser, findById } from "../services/userService";
import { setSession, deleteSession, setRefreshToken, getRefreshToken, deleteRefreshToken } from "../services/sessionStore";

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{ email: string; name: string }> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },

    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  const tokens = (await tokenRes.json()) as { id_token: string };
  // Decode id_token payload (trusted — received directly from Google token endpoint)
  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split(".")[1], "base64url").toString(),
  ) as { email: string; name: string };
  return { email: payload.email, name: payload.name };
}

export async function authRoutes(fastify: FastifyInstance) {
  // GET /oauth/:oauthProvider/callback — OAuth 授权码回调
  fastify.get(
    "/oauth/:oauthProvider/callback",
    {
      schema: {
        tags: ["Auth"],
        summary: "OAuth 授权码回调",
        description:
          "接收 OAuth 提供商重定向，用 code 换取用户信息，签发 JWT 后跳转回前端。",
        params: {
          type: "object",
          properties: {
            oauthProvider: {
              type: "string",
              enum: ["google"],
              description: "OAuth 提供商",
            },
          },
        },
        querystring: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string", description: "OAuth 授权码" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { oauthProvider } = request.params as { oauthProvider: string };
      const { code } = request.query as { code: string };
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:60001";

      if (oauthProvider !== "google") {
        return reply
          .status(400)
          .send({ error: `Unsupported provider: ${oauthProvider}` });
      }

      const redirectPath =
        process.env.GOOGLE_REDIRECT_PATH || "/oauth/google/callback";
      const redirectUri = `${request.protocol}://${request.hostname}:${process.env.BACKEND_PORT || 60000}${redirectPath}`;
      fastify.log.debug(`\n\n*******Exchanging code for user info with redirect URI: ${redirectUri}\n\n`);
      const { email, name } = await exchangeGoogleCode(code, redirectUri);

      let user = await findByEmail(email);
      if (!user) {
        user = await createUser({ email, name, provider: "google" });
      }

      const userId = (user._id as { toString(): string }).toString();
      const token = fastify.jwt.sign(
        { userId, email, provider: "google" },
        { expiresIn: "1h" },
      );
      const refreshToken = fastify.jwt.sign(
        { userId, type: "refresh" },
        { expiresIn: "30d" },
      );
      await setSession(userId, { userId, email, provider: "google", refreshToken });
      await setRefreshToken(userId, refreshToken);

      const isProd = process.env.NODE_ENV === "production";
      const cookieBase = { sameSite: "strict" as const, secure: isProd, path: "/" };
      reply.setCookie("token", token, { ...cookieBase, httpOnly: false, maxAge: 3600 });
      reply.setCookie("refreshToken", refreshToken, { ...cookieBase, httpOnly: true, maxAge: 2592000 });

      return reply.redirect(`${frontendUrl}/dashboard`);
    },
  );

  // POST /auth/refresh — 用 refresh token 换取新 access token
  fastify.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "刷新 Access Token",
        description: "使用 HttpOnly cookie 中的 refresh token 签发新的 access token。",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refreshToken = request.cookies?.refreshToken;
      if (!refreshToken) {
        return reply.status(401).send({ error: "No refresh token" });
      }

      let payload: { userId: string; type: string };
      try {
        payload = fastify.jwt.verify(refreshToken) as { userId: string; type: string };
      } catch {
        return reply.status(401).send({ error: "Invalid refresh token" });
      }

      if (payload.type !== "refresh") {
        return reply.status(401).send({ error: "Invalid token type" });
      }

      const stored = await getRefreshToken(payload.userId);
      if (!stored || stored !== refreshToken) {
        return reply.status(401).send({ error: "Refresh token revoked" });
      }

      const user = await findById(payload.userId);
      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      const newToken = fastify.jwt.sign(
        { userId: payload.userId, email: user.email, provider: user.provider },
        { expiresIn: "1h" },
      );
      await setSession(payload.userId, { userId: payload.userId, email: user.email, provider: user.provider, refreshToken });

      const isProd = process.env.NODE_ENV === "production";
      reply.setCookie("token", newToken, {
        sameSite: "strict",
        secure: isProd,
        path: "/",
        httpOnly: false,
        maxAge: 3600,
      });

      return { success: true };
    },
  );

  // POST /auth/logout — 登出，删除 Redis session
  fastify.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "登出",
        description: "删除 Redis 中对应的 JWT session。需要携带 Bearer token。",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest) => {
      const user = request.user as { userId: string };
      await deleteSession(user.userId);
      await deleteRefreshToken(user.userId);
      return { success: true };
    },
  );
}
