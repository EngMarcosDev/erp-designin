import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Informe o e-mail ou usuario");
      return;
    }
    if (!password) {
      toast.error("Informe a senha");
      return;
    }

    setIsLoading(true);
    setSecurityAlert(null);

    try {
      await login(email, password);
      setFailedAttempts(0);
      toast.success("Login realizado com sucesso");
      navigate("/pedidos");
    } catch (err: any) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      const message = err?.message || "Credenciais invalidas ou servidor indisponivel.";
      setSecurityAlert(
        `Falha de autenticacao detectada (${nextAttempts} tentativa${
          nextAttempts > 1 ? "s" : ""
        }). ${message}`
      );
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[hsl(30,20%,20%)] to-[hsl(25,25%,12%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-bar" />
        </div>
        <div className="text-center z-10">
          <div className="w-32 h-32 rounded-2xl bg-[hsl(35,80%,55%)]/12 border border-[hsl(35,80%,55%)]/30 flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-sm">
            <img src="/assets/branding/logo-erp.png" alt="ERP Bacaxita" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-[hsl(35,25%,92%)] mb-2">ERP Bacaxita</h1>
          <p className="text-lg text-[hsl(35,25%,92%)]/60">Sistema de Gestao ERP</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <img src="/assets/branding/logo-erp.png" alt="ERP Bacaxita" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ERP Bacaxita</h1>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 pb-8 px-8">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-foreground tracking-wide">ERP Bacaxita</h2>
                <p className="text-sm text-muted-foreground mt-1">Faca login para continuar</p>
              </div>

              {securityAlert && (
                <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <strong className="block text-red-200">Alerta de seguranca</strong>
                  <span>{securityAlert}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail ou Usuario</Label>
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@abacaxita.com"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="......"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    "Entrando..."
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
