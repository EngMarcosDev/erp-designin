import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ErpAccessPage = () => {
  const erpLoginUrl =
    import.meta.env.VITE_ERP_URL || "http://localhost:8081/login";

  useEffect(() => {
    window.location.href = erpLoginUrl;
  }, [erpLoginUrl]);

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground space-y-3">
            <p>Redirecionando para o ERP...</p>
            <button
              onClick={() => (window.location.href = erpLoginUrl)}
              className="px-3 py-2 rounded-md bg-rasta-green text-white text-xs font-semibold"
            >
              Abrir ERP agora
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ErpAccessPage;
