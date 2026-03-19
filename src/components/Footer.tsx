import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto">
      <div className="rasta-stripe" />

      <div className="footer-wood relative px-4 py-8 md:py-12">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 text-footer-foreground md:grid-cols-3">
            <div className="text-center md:text-left">
              <h3 className="mb-3 text-xl font-display font-bold tracking-widest md:text-2xl">ABACAXITA</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed opacity-75 md:mx-0">
                Painel ERP para gestao de catalogo, pedidos e estoque com fluxo integrado ao HeadShop.
              </p>
            </div>

            <div className="text-center">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-rasta-yellow">Links rapidos</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/" className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100">
                  Inicio
                </Link>
                <Link to="/produtos" className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100">
                  Produtos
                </Link>
                <Link to="/pedidos" className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100">
                  Pedidos
                </Link>
                <Link to="/configuracoes" className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100">
                  Configuracoes
                </Link>
              </nav>
            </div>

            <div className="text-center md:text-right">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-rasta-yellow">Contato</h4>
              <div className="flex flex-col gap-2 text-sm opacity-75">
                <a
                  href="mailto:adm.bacaxita@gmail.com"
                  className="flex items-center justify-center gap-2 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Mail className="h-4 w-4" />
                  <span>adm.bacaxita@gmail.com</span>
                </a>
                <a
                  href="tel:+5581981705445"
                  className="flex items-center justify-center gap-2 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Phone className="h-4 w-4" />
                  <span>(81) 98170-5445</span>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-end">
                <a
                  href="https://www.instagram.com/abacaxitashop?igsh=N2NncGpidDg4NmJq&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/5581981705445"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-xs opacity-50">© 2026 Abacaxita. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
