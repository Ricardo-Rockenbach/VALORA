import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada. Crie backend/.env usando backend/.env.example como modelo."
  );
}

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
