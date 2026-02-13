import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Load .env file
config();

// Prisma 7.x requires a driver adapter
const connectionString = process.env.DATABASE_URL ?? '';
if (!connectionString) throw new Error('DATABASE_URL is not set');
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
