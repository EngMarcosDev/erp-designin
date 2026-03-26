import { ShieldCheck, MonitorCog, Palette, Moon, SlidersHorizontal, TableProperties } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUISettings } from "@/contexts/UISettingsContext";
import { useERP } from "@/contexts/ERPContext";
import { PERMISSION_LABELS } from "@/types/erp";

export default function SettingsPage() {
  const {
    popupTint,
    setPopupTint,
    darkMode,
    setDarkMode,
    lowStockThreshold,
    setLowStockThreshold,
    preferStockSpreadsheet,
    setPreferStockSpreadsheet,
    compactTables,
    setCompactTables,
    showAuditHighlights,
    setShowAuditHighlights,
  } = useUISettings();
  const { currentUser } = useERP();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuracoes</h1>
          <p className="text-muted-foreground">
            Preferencias operacionais do ERP, visibilidade de auditoria e atalhos de administracao.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{currentUser.role === "ADMIN" ? "Modo administrador" : "Modo operador"}</Badge>
          <Badge variant="outline">{currentUser.active ? "Sessao ativa" : "Sessao bloqueada"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorCog className="h-5 w-5 text-primary" />
              Operacao do painel
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base">Planilha como padrao no estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Abre o estoque direto na visao tabular para contagem e importacao/exportacao.
                  </p>
                </div>
                <Switch checked={preferStockSpreadsheet} onCheckedChange={setPreferStockSpreadsheet} />
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base">Tabelas compactas</Label>
                  <p className="text-sm text-muted-foreground">
                    Diminui espacamentos para caber mais linhas nas telas de usuarios e estoque.
                  </p>
                </div>
                <Switch checked={compactTables} onCheckedChange={setCompactTables} />
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3">
              <Label className="text-base">Limite de estoque baixo</Label>
              <p className="text-sm text-muted-foreground">
                Produtos abaixo desse numero recebem destaque de alerta no painel.
              </p>
              <Input
                type="number"
                min="1"
                max="9999"
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(Number(event.target.value || 1))}
              />
            </div>

            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base">Realce de auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Destaca mudancas sensiveis de usuarios para facilitar revisao administrativa.
                  </p>
                </div>
                <Switch checked={showAuditHighlights} onCheckedChange={setShowAuditHighlights} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Aparencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Cor dos pop-ups</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={popupTint}
                  onChange={(event) => setPopupTint(event.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md p-1"
                />
                <Input value={popupTint} onChange={(event) => setPopupTint(event.target.value)} className="flex-1" />
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border p-4">
              <div>
                <Label className="text-base flex items-center gap-2">
                  <Moon className="h-4 w-4 text-accent" />
                  Modo noturno
                </Label>
                <p className="text-sm text-muted-foreground">Ativa o visual escuro para operacao noturna.</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Painel administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium text-foreground">Permissoes ativas deste usuario</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentUser.permissions.length > 0 ? (
                  currentUser.permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {PERMISSION_LABELS[permission]}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">Sem permissoes ERP</Badge>
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Recursos ja aproveitados do sistema</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sincronizacao visual de estoque ERP x HeadShop.</li>
                <li>Controle de permissoes por usuario.</li>
                <li>Popups, banners e categorias pela aba Conteudo.</li>
                <li>Auditoria de alteracoes de usuarios para administradores.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Atalhos para operadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 flex items-start gap-3">
              <TableProperties className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Fluxo sugerido</p>
                <p className="text-sm text-muted-foreground">
                  Estoque em planilha para contagem real, auditoria destacada para admins e cards compactos para rotina.
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Perfil em uso</p>
              <p className="text-sm text-muted-foreground">
                {currentUser.role === "ADMIN"
                  ? "Administrador: pode revisar usuarios, auditoria e configuracoes estrategicas."
                  : "Operador: foco em pedidos, estoque, produtos e execucao diaria."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
