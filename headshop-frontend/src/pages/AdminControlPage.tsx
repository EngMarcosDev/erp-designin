import { Link, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const erpUrl = import.meta.env.VITE_ERP_URL || "http://localhost:8081/login";
const apiUrl = import.meta.env.VITE_ERP_API_URL || "http://localhost:5050/api/erp";

const AdminControlPage = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-display font-bold text-accent uppercase tracking-widest">
              Controle
            </h1>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground space-y-3">
            <p>Portal administrativo reservado para a equipe Abacaxita.</p>
            <p>ERP Abacaxita conectado para uso local.</p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => window.open(erpUrl, "_blank")}
                className="px-3 py-2 rounded-md bg-rasta-green text-white text-xs font-semibold"
              >
                Abrir ERP Abacaxita
              </button>
              <button
                onClick={() => window.open(`${apiUrl.replace(/\/$/, "")}/products`, "_blank")}
                className="px-3 py-2 rounded-md bg-muted text-foreground text-xs font-semibold"
              >
                Ver API Local
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminControlPage;
