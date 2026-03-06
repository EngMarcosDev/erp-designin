import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const products = await prisma.product.findMany({ where: { isFeatured: true }, include: { category: true } });
console.log('featured:', products.length);
console.log(products[0]);
await prisma.$disconnect();
