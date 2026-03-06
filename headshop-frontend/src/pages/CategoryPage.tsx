import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Cigarette,
  Coffee,
  Filter,
  LayoutGrid,
  Scissors,
  Package,
  Flame,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCategory } from "@/api/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categoryNames: Record<string, string> = {
  sedas: "Sedas",
  cuia: "Cuia",
  piteira: "Piteira",
  bandeja: "Bandeja",
  tesoura: "Tesoura",
  bacakits: "BacaKits",
  fumigenos: "Fumígenos",
};

const categoryIcons: Record<string, LucideIcon> = {
  sedas: Cigarette,
  cuia: Coffee,
  piteira: Filter,
  bandeja: LayoutGrid,
  tesoura: Scissors,
  bacakits: Package,
  fumigenos: Flame,
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const categoryName = slug ? categoryNames[slug] : undefined;
  const CategoryIcon = slug ? categoryIcons[slug] : undefined;

  const productsQuery = useQuery({
    queryKey: ["products", "category", slug],
    queryFn: () => fetchProductsByCategory(slug as string),
    enabled: Boolean(slug),
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const products = productsQuery.data ?? [];

  const [materialFilter, setMaterialFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("none");

  const materials = useMemo(() => {
    const mats = new Set<string>();
    products.forEach((product) => {
      if (product.material) {
        mats.add(product.material);
      }
    });
    return Array.from(mats);
  }, [products]);

  const brands = useMemo(() => {
    const brs = new Set<string>();
    products.forEach((product) => {
      if (product.brand) {
        brs.add(product.brand);
      }
    });
    return Array.from(brs);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (materialFilter !== "all") {
      list = list.filter((product) => product.material === materialFilter);
    }
    if (brandFilter !== "all") {
      list = list.filter((product) => product.brand === brandFilter);
    }
    if (priceSort === "asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, materialFilter, brandFilter, priceSort]);

  if (!categoryName) {
    return (
      <div className="min-h-screen flex flex-col paper-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Categoria não encontrada
            </h1>
            <Link to="/" className="text-accent hover:underline">
              Voltar para início
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      {/* Category Banner */}
      <div className="category-banner">
        <div className="category-banner-bg py-3 md:py-4">
          <div className="flex items-center justify-center gap-2 md:gap-3 animate-in fade-in zoom-in-95 duration-500">
            {CategoryIcon && (
              <CategoryIcon className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />
            )}
            <h1 className="text-lg md:text-xl lg:text-2xl font-display font-bold text-white uppercase tracking-widest drop-shadow-lg">
              {categoryName}
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">

        <div className="max-w-6xl mx-auto px-4 py-6 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-[140px] md:w-[160px] bg-card border-border">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Materiais</SelectItem>
                {materials.map((mat) => (
                  <SelectItem key={mat} value={mat}>
                    {mat.charAt(0).toUpperCase() + mat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[140px] md:w-[160px] bg-card border-border">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Marcas</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className="w-[140px] md:w-[160px] bg-card border-border">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem ordem</SelectItem>
                <SelectItem value="asc">Menor preço</SelectItem>
                <SelectItem value="desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Carregando produtos...
            </div>
          ) : productsQuery.isError ? (
            <div className="text-sm text-muted-foreground">
              Não foi possível carregar os produtos.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      isNew={product.isNew}
                    />
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum produto encontrado com os filtros selecionados.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
