FROM node:20.12.2-bookworm-slim

# Install OpenSSL required by Prisma ORM
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm using corepack
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN pnpm db:generate

# Build Next.js application
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
