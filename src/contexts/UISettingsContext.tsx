import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type UISettingsValue = {
  popupTint: string;
  darkMode: boolean;
  lowStockThreshold: number;
  preferStockSpreadsheet: boolean;
  compactTables: boolean;
  showAuditHighlights: boolean;
  setPopupTint: (value: string) => void;
  setDarkMode: (value: boolean) => void;
  setLowStockThreshold: (value: number) => void;
  setPreferStockSpreadsheet: (value: boolean) => void;
  setCompactTables: (value: boolean) => void;
  setShowAuditHighlights: (value: boolean) => void;
};

const STORAGE_KEY = "erp_ui_settings";

const DEFAULT_SETTINGS = {
  popupTint: "#f4ede1",
  darkMode: false,
  lowStockThreshold: 10,
  preferStockSpreadsheet: true,
  compactTables: false,
  showAuditHighlights: true,
};

const UISettingsContext = createContext<UISettingsValue | undefined>(undefined);

const hydrateSettings = () => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_SETTINGS>;
    return {
      popupTint: typeof parsed.popupTint === "string" ? parsed.popupTint : DEFAULT_SETTINGS.popupTint,
      darkMode: parsed.darkMode === true,
      lowStockThreshold:
        typeof parsed.lowStockThreshold === "number" && Number.isFinite(parsed.lowStockThreshold)
          ? Math.max(1, Math.round(parsed.lowStockThreshold))
          : DEFAULT_SETTINGS.lowStockThreshold,
      preferStockSpreadsheet: parsed.preferStockSpreadsheet !== false,
      compactTables: parsed.compactTables === true,
      showAuditHighlights: parsed.showAuditHighlights !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [popupTint, setPopupTint] = useState<string>(DEFAULT_SETTINGS.popupTint);
  const [darkMode, setDarkMode] = useState<boolean>(DEFAULT_SETTINGS.darkMode);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(DEFAULT_SETTINGS.lowStockThreshold);
  const [preferStockSpreadsheet, setPreferStockSpreadsheet] = useState<boolean>(DEFAULT_SETTINGS.preferStockSpreadsheet);
  const [compactTables, setCompactTables] = useState<boolean>(DEFAULT_SETTINGS.compactTables);
  const [showAuditHighlights, setShowAuditHighlights] = useState<boolean>(DEFAULT_SETTINGS.showAuditHighlights);

  useEffect(() => {
    const hydrated = hydrateSettings();
    setPopupTint(hydrated.popupTint);
    setDarkMode(hydrated.darkMode);
    setLowStockThreshold(hydrated.lowStockThreshold);
    setPreferStockSpreadsheet(hydrated.preferStockSpreadsheet);
    setCompactTables(hydrated.compactTables);
    setShowAuditHighlights(hydrated.showAuditHighlights);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--popup-tint", popupTint);
  }, [popupTint]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({
      popupTint,
      darkMode,
      lowStockThreshold,
      preferStockSpreadsheet,
      compactTables,
      showAuditHighlights,
    });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [
    popupTint,
    darkMode,
    lowStockThreshold,
    preferStockSpreadsheet,
    compactTables,
    showAuditHighlights,
  ]);

  const value = useMemo<UISettingsValue>(
    () => ({
      popupTint,
      darkMode,
      lowStockThreshold,
      preferStockSpreadsheet,
      compactTables,
      showAuditHighlights,
      setPopupTint,
      setDarkMode,
      setLowStockThreshold: (value) => setLowStockThreshold(Math.max(1, Math.round(value || 1))),
      setPreferStockSpreadsheet,
      setCompactTables,
      setShowAuditHighlights,
    }),
    [
      popupTint,
      darkMode,
      lowStockThreshold,
      preferStockSpreadsheet,
      compactTables,
      showAuditHighlights,
    ]
  );

  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
}

export function useUISettings() {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error("useUISettings must be used within UISettingsProvider");
  return ctx;
}
