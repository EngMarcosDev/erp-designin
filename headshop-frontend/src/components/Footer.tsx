import { useState } from "react";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Footer = () => {
  const [aboutOpen, setAboutOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto">
      <div className="rasta-stripe" />

      <div className="footer-wood py-8 md:py-12 px-4 relative">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-footer-foreground">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-display font-bold tracking-widest mb-3">
                ABACAXITA
              </h3>
              <p className="text-sm opacity-75 leading-relaxed max-w-xs mx-auto md:mx-0">
                Sua loja de acessórios com os melhores produtos e preços do mercado.
              </p>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-4 text-rasta-yellow text-sm uppercase tracking-wider">
                Links Rápidos
              </h4>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={scrollToTop}
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Produtos
                </button>
                <Link
                  to="/categoria/bacakits"
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Promoções
                </Link>
                <button
                  onClick={() => setAboutOpen(true)}
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Sobre Nós
                </button>
              </nav>
            </div>

            <div className="text-center md:text-right">
              <h4 className="font-semibold mb-4 text-rasta-yellow text-sm uppercase tracking-wider">
                Contato
              </h4>
              <div className="flex flex-col gap-2 text-sm opacity-75">
                <a
                  href="mailto:adm.abacaxita@gmail.com"
                  className="flex items-center justify-center md:justify-end gap-2 hover:text-rasta-yellow transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>adm.abacaxita@gmail.com</span>
                </a>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-4 mt-4">
                <a
                  href="https://instagram.com/abacaxita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://wa.me/5581981705445"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-rasta-yellow">© 2026 Abacaxita. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-accent text-center">
              Sobre a Abacaxita
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground leading-relaxed">
              Olá, texo teste de apresentação, caso eu tenha esquecido de mudar, me lembre. vlw
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
