import ProductCard from "./ProductCard";
import { Skeleton } from "./ui/skeleton";
import type { Product } from "@/api/types";

interface ProductSectionProps {
  title: string;
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  isError?: boolean;
  errorMessage?: string;
}

const ProductSection = ({
  title,
  products,
  isLoading = false,
  emptyMessage = "Nenhum produto encontrado.",
  isError = false,
  errorMessage = "Não foi possível carregar os produtos.",
}: ProductSectionProps) => {
  const showEmpty = !isLoading && products.length === 0;
  const showError = !isLoading && isError;

  return (
    <section className="py-6 md:py-10 lg:py-12 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Title */}
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-display font-semibold text-accent text-center mb-4 sm:mb-6 md:mb-8 uppercase tracking-widest">
          {title}
        </h2>

        {/* Product Grid */}
        {showError ? (
          <div className="text-center text-sm text-muted-foreground">
            {errorMessage}
          </div>
        ) : showEmpty ? (
          <div className="text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5 justify-items-center w-full max-w-5xl">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="card-product p-3 md:p-4 flex flex-col h-full"
                  >
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="flex-1 min-h-[100px] md:min-h-[130px] mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-6 w-24 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    isNew={product.isNew}
                  />
                ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
