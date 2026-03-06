import { useState } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { Button } from "./ui/button";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { user, logout } = useAuth();

  const triggerAuthPopup = (mode: "login" | "register") => {
    window.dispatchEvent(new CustomEvent("abacaxita:login-popup", { detail: { force: true, mode } }));
  };

  return (
    <>
      <header className="w-full">
        {/* Navigation Bar - Compact */}
        <nav className="bg-header">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo/Name on Left */}
            <h1 className="text-xl sm:text-2xl font-display font-bold text-header-foreground tracking-widest">
              ABACAXITA
            </h1>

            {/* Icons on Right */}
            <div className="flex items-center gap-1">
              {user?.email ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-header-foreground/80 hover:text-header-foreground hover:bg-white/5 h-8 px-2 text-[11px] uppercase tracking-wider"
                >
                  Sair
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerAuthPopup("login")}
                    className="text-header-foreground/80 hover:text-header-foreground hover:bg-white/5 h-8 px-2 text-[11px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    Login
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerAuthPopup("register")}
                    className="text-header-foreground/80 hover:text-header-foreground hover:bg-white/5 h-8 px-2 text-[11px] uppercase tracking-wider"
                  >
                    Criar conta
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="text-header-foreground/80 hover:text-header-foreground hover:bg-white/5 relative h-9 w-9"
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
                className="text-header-foreground/80 hover:text-header-foreground hover:bg-white/5 h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
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
