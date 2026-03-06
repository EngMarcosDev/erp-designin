import { X } from "lucide-react";
import pedidoOk from "@/assets/bacaxito-pedido-ok.png";
import { Button } from "./ui/button";

interface OrderSuccessPopupProps {
  orderId: number | string;
  onClose: () => void;
}

const OrderSuccessPopup = ({ orderId, onClose }: OrderSuccessPopupProps) => {
  const handleTrack = () => {
    const message = encodeURIComponent(
      `Olá, solicito o rastreio do meu pedido de número: ${orderId}`
    );
    window.open(`https://wa.me/5581981705445?text=${message}`, "_blank");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[560px] bg-card rounded-2xl border border-border/80 z-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-center text-2xl font-display font-bold text-foreground tracking-wider mb-4">
            Pedido realizado!
          </h2>

          <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/30 mb-4">
            <img
              src={pedidoOk}
              alt="Pedido realizado com sucesso"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mb-4">
            Número do pedido: <span className="font-semibold text-foreground">{orderId}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={handleTrack}
              className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold"
            >
              Rastrear pedido
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full border-border hover:bg-muted"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccessPopup;
