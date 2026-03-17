# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeapp
USER nodeapp

EXPOSE 60000

CMD ["node", "dist/index.js"]
