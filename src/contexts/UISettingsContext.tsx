import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UISettings {
  popupTint: string;
  darkMode: boolean;
  setPopupTint: (value: string) => void;
  setDarkMode: (value: boolean) => void;
}

const UISettingsContext = createContext<UISettings | undefined>(undefined);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [popupTint, setPopupTint] = useState<string>('#f4ede1');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--popup-tint', popupTint);
  }, [popupTint]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <UISettingsContext.Provider value={{ popupTint, darkMode, setPopupTint, setDarkMode }}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error('useUISettings must be used within UISettingsProvider');
  return ctx;
}
