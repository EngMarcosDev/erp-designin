import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";
import PaymentPopup from "./PaymentPopup";

const PENDING_CHECKOUT_KEY = "abacaxita_pending_checkout";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentInitPoint, setPaymentInitPoint] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const runCheckout = async (checkoutItems = items, checkoutUser = user) => {
    if (!checkoutUser?.email || checkoutItems.length === 0) return;
    const displayName = checkoutUser?.name?.trim() || checkoutUser.email.split("@")[0];
    const orderPayload = {
      customer: {
        name: displayName || "Cliente",
        email: checkoutUser.email,
      },
      items: checkoutItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      const response = await fetch(joinUrl(API_BASE, "/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error("Falha ao registrar o pedido");
      }

      const order = await response.json().catch(() => null);
      const orderId = order?.id ?? order?.orderId;
      if (!orderId) {
        throw new Error("Pedido sem ID");
      }
      let initPoint: string | null = null;
      try {
        const preferenceResponse = await fetch(joinUrl(API_BASE, "/payments/mercadopago/preference"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId,
            payerEmail: checkoutUser.email,
            items: checkoutItems.map((item) => ({
              title: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          }),
        });

        if (preferenceResponse.ok) {
          const preference = await preferenceResponse.json().catch(() => null);
          initPoint = preference?.init_point || preference?.sandbox_init_point || null;
        }
      } catch {
        // keep fallback below
      }

      if (!initPoint) {
        initPoint = `${window.location.origin}/pagamento/pendente?orderId=${orderId}`;
      }

      setPaymentInitPoint(initPoint);
      setPaymentOrderId(orderId);
      setIsOpen(false);
      window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch (error) {
      console.error(error);
      alert("Não foi possível iniciar o pagamento. Tente novamente.");
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user?.email) {
      const snapshot = {
        createdAt: Date.now(),
        items,
      };
      window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(snapshot));
      window.dispatchEvent(
        new CustomEvent("abacaxita:login-popup", { detail: { force: true } })
      );
      return;
    }
    await runCheckout(items, user);
  };

  useEffect(() => {
    if (!user?.email) return;
    try {
      const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as { items?: typeof items };
      const pendingItems = Array.isArray(pending?.items) ? pending.items : [];
      if (pendingItems.length > 0) {
        void runCheckout(pendingItems, user);
      } else {
        window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
      }
    } catch {
      window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  }, [user?.email]);

  if (!isOpen && !paymentInitPoint) return null;

  return (
    <>
      {paymentInitPoint && paymentOrderId && (
        <PaymentPopup
          initPoint={paymentInitPoint}
          orderId={paymentOrderId}
          onClose={() => setPaymentInitPoint(null)}
        />
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-2xl animate-in slide-in-from-right duration-150 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-header">
              <div className="flex items-center gap-2 text-header-foreground">
                <ShoppingBag className="w-5 h-5" />
                <span id="cart-title" className="font-display font-bold tracking-wider">SACOLA</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-header-foreground/80 hover:text-white p-1"
                aria-label="Fechar sacola"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Sua sacola está vazia</p>
                  <p className="text-sm">Adicione produtos para continuar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {item.name}
                        </h4>
                        <p className="text-accent font-bold text-sm mt-1">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-background border border-border rounded hover:bg-muted transition-colors"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-background border border-border rounded hover:bg-muted transition-colors"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-destructive/70 hover:text-destructive p-1"
                            aria-label="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-xl font-bold text-accent">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <Button
                  className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold"
                  onClick={handleCheckout}
                >
                  Finalizar Pedido
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 py-2"
                >
                  Limpar sacola
                </button>
              </div>
            )}

            <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
          </div>
        </>
      )}
    </>
  );
};

export default CartSidebar;
