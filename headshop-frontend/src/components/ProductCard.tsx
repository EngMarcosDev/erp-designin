import { useEffect, useState } from "react";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  isNew?: boolean;
}

const ProductCard = ({ id, name, price, image, isNew = false }: ProductCardProps) => {
  const { addItem, items, updateQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price * quantity);

  const handleAddToCart = () => {
    addItem({ id, name, price, image });
    setJustAdded(true);
  };

  const handleIncrement = () => {
    addItem({ id, name, price, image });
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1200);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  return (
    <div className="card-product p-3 md:p-4 flex flex-col h-full min-h-[290px] md:min-h-[330px] group">
      {/* Badge */}
      {isNew && (
        <div className="mb-2">
          <span className="badge-new">Lançamento</span>
        </div>
      )}

      {/* Image */}
      <div className="flex-1 min-h-[100px] md:min-h-[130px] flex items-center justify-center mb-3 rounded-md bg-muted/50 overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          className="max-h-[100px] md:max-h-[130px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground text-xs md:text-sm leading-tight line-clamp-2">
          {name}
        </h3>
        <p className="text-lg md:text-xl font-bold text-accent">
          {formattedPrice}
        </p>

        {quantity === 0 ? (
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold uppercase tracking-wider text-[10px] md:text-xs h-8"
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
            {justAdded ? "Adicionado" : "Adicionar"}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 h-8 bg-muted rounded-md">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDecrement}
              className="h-7 w-7 hover:bg-rasta-red/20 text-rasta-red"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="font-bold text-sm min-w-[24px] text-center text-foreground">
              {quantity}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleIncrement}
              className="h-7 w-7 hover:bg-rasta-green/20 text-rasta-green"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        {quantity > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Total: {formattedTotal}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
