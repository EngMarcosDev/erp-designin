import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "adm.abacaxita@gmail.com";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || "change_me";
  const adminPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const categories = [
    { name: "Sedas", slug: "sedas" },
    { name: "Cuia", slug: "cuia" },
    { name: "Piteira", slug: "piteira" },
    { name: "Bandeja", slug: "bandeja" },
    { name: "Tesoura", slug: "tesoura" },
    { name: "BacaKits", slug: "bacakits" },
    { name: "Fumígenos", slug: "fumigenos" },
  ];

  const categoryMap = new Map<string, number>();

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryMap.set(category.slug, created.id);
  }

  const products = [
    {
      name: "Bem Bolado Brown",
      price: 4.9,
      image:
        "https://images.unsplash.com/photo-1588171771840-27060b450e01?w=300&h=200&fit=crop",
      isNew: true,
      isFeatured: true,
      category: "sedas",
      colors: "marrom",
      materials: "papel",
      stockQty: 120,
    },
    {
      name: "Piteira Sadhu Premium",
      price: 5.9,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
      isNew: true,
      isFeatured: true,
      category: "piteira",
      colors: "branco",
      materials: "papel",
      stockQty: 200,
    },
    {
      name: "Sadhu Extra Large",
      price: 5.9,
      image:
        "https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=200&fit=crop",
      isNew: true,
      isFeatured: true,
      category: "piteira",
      colors: "natural",
      materials: "papel",
      stockQty: 150,
    },
    {
      name: "Kit Cuia Mate Premium",
      price: 89.9,
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop",
      isFeatured: true,
      category: "cuia",
      colors: "metal",
      materials: "inox",
      stockQty: 30,
    },
    {
      name: "Pote Hermético Verde",
      price: 24.9,
      image:
        "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=300&h=200&fit=crop",
      isPopular: true,
      category: "bacakits",
      colors: "verde",
      materials: "plastico",
      stockQty: 40,
    },
    {
      name: "Reservatório Compacto",
      price: 19.9,
      image:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=200&fit=crop",
      isPopular: true,
      category: "bacakits",
      colors: "preto",
      materials: "plastico",
      stockQty: 50,
    },
    {
      name: "Dichavador Metálico",
      price: 29.9,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      isPopular: true,
      category: "bacakits",
      colors: "prata",
      materials: "metal",
      stockQty: 35,
    },
    {
      name: "Kit Acessórios Completo",
      price: 149.9,
      image:
        "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=200&fit=crop",
      isNew: true,
      isPopular: true,
      category: "bacakits",
      colors: "colorido",
      materials: "metal,plastico",
      stockQty: 12,
    },
  ];

  for (const product of products) {
    const categoryId = categoryMap.get(product.category);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        name: product.name,
        price: product.price,
        image: product.image,
        isNew: product.isNew ?? false,
        isFeatured: product.isFeatured ?? false,
        isPopular: product.isPopular ?? false,
        categoryId,
        colors: product.colors,
        materials: product.materials,
        stockQty: product.stockQty,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
