import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderSuccessPopup from "@/components/OrderSuccessPopup";
import { useCart } from "@/contexts/CartContext";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("orderId");
    if (id) {
      setOrderId(id);
      clearCart();
    }
  }, [location.search, clearCart]);

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center text-muted-foreground">
          Finalizando pagamento...
        </div>
      </main>
      <Footer />
      {orderId && (
        <OrderSuccessPopup orderId={orderId} onClose={() => setOrderId(null)} />
      )}
    </div>
  );
};

export default PaymentSuccessPage;
