import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://abacaxita:change_me@postgres:5432/abacaxita_erp?schema=headshop",
    },
  },
});

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
