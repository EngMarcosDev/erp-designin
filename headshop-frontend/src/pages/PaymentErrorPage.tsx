import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PaymentErrorPage = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("orderId");
    if (id) setOrderId(id);
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Pagamento não concluído
          </h1>
          <p className="text-sm text-muted-foreground">
            Não foi possível finalizar o pagamento. Tente novamente.
          </p>
          {orderId && (
            <p className="text-xs text-muted-foreground mt-2">
              Pedido #{orderId}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentErrorPage;
