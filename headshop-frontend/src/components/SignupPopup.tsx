import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const SignupPopup = () => {
  const { totalItems } = useCart();
  const { user, login, loginWithGoogle, register, verifyEmail } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [message, setMessage] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const timerRef = useRef<number | null>(null);
  const prevTotalItemsRef = useRef<number>(totalItems);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const isLogged = Boolean(user?.email && user?.token);

  const openPopup = (force = false, targetMode: "login" | "register" | "verify" = "login") => {
    if (isLogged) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (force) setMode(targetMode);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isLogged) return;

    timerRef.current = window.setTimeout(() => {
      openPopup(false);
    }, 4000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [user?.email]);

  useEffect(() => {
    if (!isLogged && totalItems > prevTotalItemsRef.current) {
      openPopup(false);
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems, isLogged]);

  useEffect(() => {
    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<{ force?: boolean; mode?: "login" | "register" }>).detail;
      openPopup(Boolean(detail?.force), detail?.mode || "login");
    };

    window.addEventListener("abacaxita:login-popup", onTrigger as EventListener);
    return () => {
      window.removeEventListener("abacaxita:login-popup", onTrigger as EventListener);
    };
  }, [isLogged]);

  useEffect(() => {
    if (isLogged && isOpen) {
      setIsOpen(false);
    }
  }, [isLogged, isOpen]);

  const normalizeEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.endsWith("@gmail.cc")) {
      return trimmed.replace("@gmail.cc", "@gmail.com");
    }
    return trimmed;
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!loginForm.email.trim() || !loginForm.password.trim()) return;
    const normalizedEmail = normalizeEmail(loginForm.email);
    if (normalizedEmail !== loginForm.email.trim().toLowerCase()) {
      setLoginForm((prev) => ({ ...prev, email: normalizedEmail }));
    }
    const ok = await login(normalizedEmail, loginForm.password.trim());
    if (ok) {
      setIsOpen(false);
      return;
    }
    setMessage("Não foi possível entrar. Verifique seus dados.");
  };

  const setupGoogleButton = () => {
    if (!googleClientId || !window.google || !googleButtonRef.current) return;
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        const result = await loginWithGoogle(credential);
        if (result.ok) {
          setIsOpen(false);
          return;
        }
        if (result.needsRegister) {
          setRegisterForm((prev) => ({
            ...prev,
            name: result.name || prev.name,
            email: result.email || prev.email,
          }));
          setMode("register");
          setMessage(result.error || "E-mail Google não cadastrado. Complete seu cadastro.");
          return;
        }
        setMessage(result.error || "Não foi possível entrar com Google.");
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "filled_blue",
      shape: "pill",
      text: "signin_with",
      width: 300,
    });
  };

  useEffect(() => {
    if (!isOpen || mode !== "login" || !googleClientId) return;
    if (window.google) {
      setupGoogleButton();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setupGoogleButton();
    document.head.appendChild(script);
  }, [isOpen, mode, googleClientId]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!registerForm.name.trim() || !registerForm.email.trim()) return;
    if (!registerForm.password.trim() || registerForm.password !== registerForm.confirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    const normalizedEmail = normalizeEmail(registerForm.email);
    if (normalizedEmail !== registerForm.email.trim().toLowerCase()) {
      setRegisterForm((prev) => ({ ...prev, email: normalizedEmail }));
    }

    const result = await register({
      name: registerForm.name.trim(),
      phone: registerForm.phone.trim() || undefined,
      email: normalizedEmail,
      password: registerForm.password.trim(),
    });

    if (!result.ok) {
      setMessage(result.error || "Não foi possível criar a conta.");
      return;
    }

    setPendingEmail(normalizedEmail);
    setMode("verify");
    if (result.verificationCode) {
      setMessage(`Código de verificação: ${result.verificationCode}`);
    } else {
      setMessage("Enviamos um código para o seu e-mail.");
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!pendingEmail || !verifyCode.trim()) return;
    const ok = await verifyEmail(pendingEmail, verifyCode.trim());
    if (!ok) {
      setMessage("Código inválido ou expirado.");
      return;
    }
    setMessage("E-mail verificado! Faça login.");
    setMode("login");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={() => setIsOpen(false)}
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[520px] bg-card rounded-2xl border border-border/80 z-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="p-6 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-center text-2xl font-display font-bold text-foreground tracking-wider mb-4">
            ABACAXITA
          </h2>

          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative bg-muted rounded-2xl p-3 mb-4">
                <p className="text-foreground text-sm leading-relaxed">
                  Opa! Parece que você é novo aqui ou ainda não fez o teu login.
                </p>
                <div className="absolute -right-2 top-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-muted" />
              </div>

              {message && (
                <div className="mb-3 text-xs text-muted-foreground bg-muted/60 border border-border rounded-md px-3 py-2">
                  {message}
                </div>
              )}

              {mode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      autoComplete="username"
                      className="flex-1 bg-muted border-border focus:border-accent"
                    />

                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Senha"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        autoComplete="current-password"
                        className="w-full bg-muted border-border focus:border-accent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold">
                    Entrar
                  </Button>

                  {googleClientId && (
                    <div className="flex justify-center">
                      <div ref={googleButtonRef} />
                    </div>
                  )}

                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMode("register");
                      setMessage(null);
                    }}
                  >
                    Criar conta
                  </button>
                </form>
              )}

              {mode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Nome"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    className="w-full bg-muted border-border focus:border-accent"
                  />
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Telefone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    className="w-full bg-muted border-border focus:border-accent"
                  />
                  <Input
                    type="email"
                    name="email"
                    placeholder="E-mail"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className="w-full bg-muted border-border focus:border-accent"
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Senha"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      className="w-full bg-muted border-border focus:border-accent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      name="confirm"
                      placeholder="Repetir senha"
                      value={registerForm.confirm}
                      onChange={handleRegisterChange}
                      className="w-full bg-muted border-border focus:border-accent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold">
                    Criar conta
                  </Button>

                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMode("login");
                      setMessage(null);
                    }}
                  >
                    Já tenho conta
                  </button>
                </form>
              )}

              {mode === "verify" && (
                <form onSubmit={handleVerifySubmit} className="space-y-3">
                  <Input
                    type="text"
                    name="code"
                    placeholder="Código de verificação"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    className="w-full bg-muted border-border focus:border-accent"
                  />
                  <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold">
                    Verificar e-mail
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMode("login");
                      setMessage(null);
                    }}
                  >
                    Voltar ao login
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPopup;
