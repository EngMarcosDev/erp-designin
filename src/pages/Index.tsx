import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import ProductSection from "@/components/ProductSection";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import SignupPopup from "@/components/SignupPopup";
import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts, fetchPopularProducts } from "@/api/products";

const Index = () => {
  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

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
        <ProductSection
          title="Novas Estampas Maçaricos Naar"
          products={featuredQuery.data ?? []}
          isLoading={featuredQuery.isLoading}
          isError={featuredQuery.isError}
          emptyMessage="Sem novidades por enquanto."
          errorMessage="Não foi possível carregar as novidades."
        />
        <ProductSection
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
      <SignupPopup />
    </div>
  );
};

export default Index;
