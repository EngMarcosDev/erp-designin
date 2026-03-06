import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Informe o e-mail ou usuário');
      return;
    }
    if (!password) {
      toast.error('Informe a senha');
      return;
    }

    setIsLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5050';
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Credenciais inválidas');
        setIsLoading(false);
        return;
      }
      toast.success('Login realizado com sucesso!');
      navigate('/pedidos');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Logo */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[hsl(30,20%,20%)] to-[hsl(25,25%,12%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-bar" />
        </div>
        <div className="text-center z-10">
          <div className="w-32 h-32 rounded-2xl bg-[hsl(35,80%,55%)] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-6xl font-bold text-[hsl(30,20%,15%)]">B</span>
          </div>
          <h1 className="text-5xl font-bold text-[hsl(35,25%,92%)] mb-2">Abacaxita</h1>
          <p className="text-lg text-[hsl(35,25%,92%)]/60">Sistema de Gestão ERP</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary-foreground">B</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Abacaxita</h1>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Efetue seu Login</h2>
                <p className="text-sm text-foreground mt-1">Me parece que você é novo aqui ou ainda não realizou o seu login!</p>
                <p className="text-xs text-muted-foreground mt-1">Realize seu cadastro para receber 5% de desconto na primeira compra.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail ou Usuário</Label>
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Efetue seu Login
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
