import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuLinks = [
  { name: "Início", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Sobre", href: "/sobre" },
  { name: "Contato", href: "/contato" },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user } = useAuth();
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const links = [
    ...menuLinks,
    ...(user ? [{ name: "Histórico de Compras", href: "/historico" }] : []),
    ...(user ? [{ name: "ERP Abacaxita", href: "/erp" }] : []),
    ...(user?.isAdmin ? [{ name: "Controle", href: "/controle" }] : []),
  ];

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className="fixed top-0 right-0 h-full w-72 bg-header z-50 shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
          }
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span
            id="mobile-menu-title"
            className="text-header-foreground font-display font-bold tracking-widest text-lg"
          >
            MENU
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="text-header-foreground/80 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1">
          {links.map((link, index) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={onClose}
              ref={index === 0 ? firstLinkRef : undefined}
              className="text-header-foreground/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Rasta accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
      </div>
    </>
  );
};

export default MobileMenu;
