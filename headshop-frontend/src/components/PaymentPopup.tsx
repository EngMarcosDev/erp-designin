import { X } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentPopupProps {
  initPoint: string;
  orderId: number | string;
  onClose: () => void;
}

const PaymentPopup = ({ initPoint, orderId, onClose }: PaymentPopupProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[760px] bg-card rounded-2xl border border-border/80 z-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
        <div className="p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-center text-xl font-display font-bold text-foreground tracking-wider mb-2">
            Pagamento Mercado Pago
          </h2>
          <p className="text-center text-xs text-muted-foreground mb-4">
            Pedido #{orderId}
          </p>

          <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/30 mb-4">
            <iframe
              src={initPoint}
              title="Pagamento Mercado Pago"
              className="w-full h-[520px] bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold"
              onClick={() => window.open(initPoint, "_blank")}
            >
              Abrir pagamento em nova guia
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-muted"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPopup;
