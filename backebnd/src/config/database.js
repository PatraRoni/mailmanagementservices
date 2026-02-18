import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection
export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
export async function disconnectDB() {
  await prisma.$disconnect();
  console.log('Database disconnected');
}
