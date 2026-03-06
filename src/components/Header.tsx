import { useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  return (
    <>
      <header className="w-full">
        {/* Logo Section */}
        <div className="header-wood py-4 sm:py-5 md:py-8 px-3 sm:px-4 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-center">
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-bold text-header-foreground tracking-[0.15em] sm:tracking-[0.2em]">
              BACAXITA
            </h1>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="bg-header border-t border-white/10">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-[#f7f1e8] to-[#f0e8d8] flex items-center justify-center text-sm font-bold text-[#9c7a3b]">
                B
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">Abacaxita</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="text-header-foreground hover:bg-white/10 relative h-9 w-9"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rasta-green text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="text-header-foreground hover:bg-white/10 h-9 w-9"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </nav>

        {/* Rasta Stripe */}
        <div className="rasta-stripe" />
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;
