import { useUISettings } from "@/contexts/UISettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Palette, Moon } from "lucide-react";

export default function SettingsPage() {
  const { popupTint, setPopupTint, darkMode, setDarkMode } = useUISettings();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize o visual do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Cor dos Pop-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-sm text-muted-foreground">Escolha o tom de fundo dos diálogos</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={popupTint}
                onChange={(event) => setPopupTint(event.target.value)}
                className="w-16 h-10 p-1 rounded-md cursor-pointer"
              />
              <Input value={popupTint} onChange={(event) => setPopupTint(event.target.value)} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-accent" />
              Modo Noturno
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Ativar tema escuro</p>
              <p className="text-sm text-muted-foreground">Ativa o novo visual noturno com contraste premium.</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
