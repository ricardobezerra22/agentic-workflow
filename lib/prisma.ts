import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: any }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(process.env.TEST_DATABASE_URL && { datasourceUrl: process.env.TEST_DATABASE_URL }),
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
