import type { Product } from "./types";

const featuredProducts: Product[] = [
  {
    id: 1,
    name: "Bem Bolado Brown",
    price: 4.9,
    image:
      "https://images.unsplash.com/photo-1588171771840-27060b450e01?w=300&h=200&fit=crop",
    isNew: true,
    category: "sedas",
  },
  {
    id: 2,
    name: "Piteira Sadhu Premium",
    price: 5.9,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    isNew: true,
    category: "piteira",
  },
  {
    id: 3,
    name: "Sadhu Extra Large",
    price: 5.9,
    image:
      "https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=200&fit=crop",
    isNew: true,
    category: "piteira",
  },
  {
    id: 4,
    name: "Kit Cuia Mate Premium",
    price: 89.9,
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop",
    category: "cuia",
  },
];

const popularProducts: Product[] = [
  {
    id: 5,
    name: "Pote Hermético Verde",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=300&h=200&fit=crop",
    category: "bacakits",
  },
  {
    id: 6,
    name: "Reservatório Compacto",
    price: 19.9,
    image:
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=200&fit=crop",
    category: "bacakits",
  },
  {
    id: 7,
    name: "Dichavador Metálico",
    price: 29.9,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
    category: "bacakits",
  },
  {
    id: 8,
    name: "Kit Acessórios Completo",
    price: 149.9,
    image:
      "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=200&fit=crop",
    isNew: true,
    category: "bacakits",
  },
];

const categoryProducts: Record<string, Product[]> = {
  sedas: [
    {
      id: 101,
      name: "Seda Bem Bolado Brown",
      price: 4.9,
      image:
        "https://images.unsplash.com/photo-1588171771840-27060b450e01?w=300&h=200&fit=crop",
      isNew: true,
      category: "sedas",
    },
    {
      id: 102,
      name: "Seda Smoking Blue",
      price: 5.5,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
      category: "sedas",
    },
    {
      id: 103,
      name: "Seda RAW Classic",
      price: 6.9,
      image:
        "https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=200&fit=crop",
      category: "sedas",
    },
  ],
  cuia: [
    {
      id: 201,
      name: "Cuia Tradicional",
      price: 45.9,
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop",
      category: "cuia",
    },
    {
      id: 202,
      name: "Cuia Premium Inox",
      price: 89.9,
      image:
        "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=300&h=200&fit=crop",
      isNew: true,
      category: "cuia",
    },
  ],
  piteira: [
    {
      id: 301,
      name: "Piteira Sadhu Premium",
      price: 5.9,
      image:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=200&fit=crop",
      isNew: true,
      category: "piteira",
    },
    {
      id: 302,
      name: "Piteira de Vidro",
      price: 12.9,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      category: "piteira",
    },
  ],
  bandeja: [
    {
      id: 401,
      name: "Bandeja Rasta Wood",
      price: 49.9,
      image:
        "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=200&fit=crop",
      category: "bandeja",
    },
    {
      id: 402,
      name: "Bandeja Metal Premium",
      price: 79.9,
      image:
        "https://images.unsplash.com/photo-1588171771840-27060b450e01?w=300&h=200&fit=crop",
      isNew: true,
      category: "bandeja",
    },
  ],
  tesoura: [
    {
      id: 501,
      name: "Tesoura Inox Pro",
      price: 29.9,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
      category: "tesoura",
    },
  ],
  bacakits: [
    {
      id: 601,
      name: "Kit Iniciante Completo",
      price: 99.9,
      image:
        "https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=200&fit=crop",
      isNew: true,
      category: "bacakits",
    },
    {
      id: 602,
      name: "Kit Premium Gold",
      price: 199.9,
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop",
      category: "bacakits",
    },
  ],
  fumigenos: [
    {
      id: 701,
      name: "Incenso Natural",
      price: 14.9,
      image:
        "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=300&h=200&fit=crop",
      category: "fumigenos",
    },
    {
      id: 702,
      name: "Ervas Aromáticas",
      price: 24.9,
      image:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=200&fit=crop",
      category: "fumigenos",
    },
  ],
};

export const mockApi = {
  featuredProducts: () => featuredProducts,
  popularProducts: () => popularProducts,
  productsByCategory: (slug: string) => categoryProducts[slug] ?? [],
};
