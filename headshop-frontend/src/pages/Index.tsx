import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import ProductSection from "@/components/ProductSection";
import NewsBanner from "@/components/NewsBanner";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchPopularProducts } from "@/api/products";

const Index = () => {
  const location = useLocation();
  const popularQuery = useQuery({
    queryKey: ["products", "popular"],
    queryFn: fetchPopularProducts,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <PromoBanner />
        <CategoryNav />
        <NewsBanner />
        <ProductSection
          key={`popular-${location.key}`}
          title="Mais Vendidos"
          products={popularQuery.data ?? []}
          isLoading={popularQuery.isLoading}
          isError={popularQuery.isError}
          emptyMessage="Sem produtos populares no momento."
          errorMessage="Não foi possível carregar os mais vendidos."
        />
      </main>

      <Footer />
      <CartSidebar />
    </div>
  );
};

export default Index;
