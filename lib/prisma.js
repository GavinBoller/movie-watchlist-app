import { PrismaClient } from '@prisma/client';

// This is a global variable to prevent multiple instances of PrismaClient in development.
// In development, Next.js hot-reloads modules, which can cause new PrismaClient instances
// to be created on every reload, leading to too many database connections.
// By storing it on the global object, we ensure a single instance is reused.

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const prisma = globalThis.prisma || prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;