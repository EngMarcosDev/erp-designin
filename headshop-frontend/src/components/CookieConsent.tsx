import { useEffect, useState } from "react";

type CookieMode = "all" | "required";

const STORAGE_KEY = "abacaxita_cookie_preferences";

const applyMode = (mode: CookieMode) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `abacaxita_cookie_mode=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setOpen(true);
      return;
    }

    if (saved === "all" || saved === "required") {
      applyMode(saved);
    }
  }, []);

  const saveChoice = (mode: CookieMode) => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    applyMode(mode);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-4 left-4 z-40 rounded-full border border-zinc-200/25 bg-zinc-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-100 shadow-lg backdrop-blur"
      >
        Cookies
      </button>

      {open && (
        <section className="fixed bottom-16 left-4 right-4 z-50 max-w-md rounded-xl border border-zinc-200/20 bg-zinc-950 p-4 text-zinc-100 shadow-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-50">Preferencias de Cookies</h3>
          <p className="mt-2 text-xs text-zinc-200">
            Escolha como deseja usar cookies nesta sessao no HeadShop.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => saveChoice("all")}
              className="flex-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Permitir todos
            </button>
            <button
              type="button"
              onClick={() => saveChoice("required")}
              className="flex-1 rounded-md border border-white/20 bg-transparent px-3 py-2 text-xs font-semibold text-white"
            >
              Somente necessarios
            </button>
          </div>
        </section>
      )}
    </>
  );
}
