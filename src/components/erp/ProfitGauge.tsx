import { useMemo } from "react";
import type { Order } from "@/types/erp";
import { formatPrice } from "@/lib/priceFormatter";

interface ProfitGaugeProps {
  orders: Order[];
}

// Velocimetro de margem de lucro (%). Usamos apenas pedidos com status "pago"
// ou "enviado" (ou seja, receita ja confirmada) e comparamos com o custo
// registrado em cada produto (Product.cost). Se algum item nao tiver cost
// cadastrado, ele nao entra na conta do lucro - o que deixa o ponteiro
// subestimando (pessimista). Isso eh de proposito: assim o admin sabe
// quando falta cadastrar custo.
//
// Faixas de cor:
//   < 10%       vermelho  (margem baixa, alerta)
//   10% - 24%   amarelo   (margem moderada)
//   >= 25%      verde     (margem saudavel)
//
// Escala do arco: 0% a 60%. Margens acima de 60% sao ancoradas no maximo.
const MIN_PCT = 0;
const MAX_PCT = 60;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
};

const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

const ProfitGauge = ({ orders }: ProfitGaugeProps) => {
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === "pago" || o.status === "enviado");
    let totalRevenue = 0;
    let totalCost = 0;
    let itemsWithoutCost = 0;
    let totalItems = 0;

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        totalItems += 1;
        const revenue = Number(item.unitPrice || 0) * Number(item.quantity || 0);
        totalRevenue += revenue;
        const cost = Number(item.cost || 0);
        if (cost > 0) {
          totalCost += cost * Number(item.quantity || 0);
        } else {
          itemsWithoutCost += 1;
        }
      });
    });

    const profit = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    return {
      paidOrders: paidOrders.length,
      totalRevenue,
      totalCost,
      profit,
      marginPct,
      itemsWithoutCost,
      totalItems,
    };
  }, [orders]);

  const clamped = clamp(stats.marginPct, MIN_PCT, MAX_PCT);
  // Arco de -180deg a 0deg (semicirculo superior), 180 graus de amplitude.
  const needleAngle = 180 + ((clamped - MIN_PCT) / (MAX_PCT - MIN_PCT)) * 180;

  const color =
    stats.marginPct < 10
      ? "#e3524d" // rasta-red-ish
      : stats.marginPct < 25
        ? "#f5c140" // rasta-yellow-ish
        : "#3aa55f"; // rasta-green-ish

  const label =
    stats.marginPct < 10 ? "Margem baixa" : stats.marginPct < 25 ? "Margem moderada" : "Margem saudavel";

  const W = 260;
  const H = 160;
  const CX = W / 2;
  const CY = 130;
  const R = 100;

  // Tres trechos do arco para dar a "pizza" colorida no fundo (red -> yellow -> green)
  // Proporcoes: 0-10% = 1/6, 10-25% = 1/4, 25-60% = restante (0.5833). Em graus: 30, 45, 105
  const arcRed = describeArc(CX, CY, R, 180, 210); // 0 a 10%
  const arcYellow = describeArc(CX, CY, R, 210, 255); // 10 a 25%
  const arcGreen = describeArc(CX, CY, R, 255, 360); // 25 a 60%

  const needle = polarToCartesian(CX, CY, R - 12, needleAngle);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Velocimetro de lucro
          </p>
          <p className="text-xs text-muted-foreground">Calculado sobre pedidos pagos / enviados</p>
        </div>
        <span
          className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-[160px] w-full max-w-[260px]">
        {/* fundo cinza do arco */}
        <path d={describeArc(CX, CY, R, 180, 360)} fill="none" stroke="#e6e3dc" strokeWidth="14" strokeLinecap="round" />
        {/* faixas coloridas */}
        <path d={arcRed} fill="none" stroke="#e3524d" strokeWidth="14" strokeLinecap="butt" opacity="0.85" />
        <path d={arcYellow} fill="none" stroke="#f5c140" strokeWidth="14" strokeLinecap="butt" opacity="0.9" />
        <path d={arcGreen} fill="none" stroke="#3aa55f" strokeWidth="14" strokeLinecap="butt" opacity="0.9" />

        {/* ticks: 0 | 10 | 25 | 60 */}
        {[0, 10, 25, 60].map((pct) => {
          const tickAngle = 180 + (pct / MAX_PCT) * 180;
          const outer = polarToCartesian(CX, CY, R + 4, tickAngle);
          const inner = polarToCartesian(CX, CY, R - 18, tickAngle);
          const labelPos = polarToCartesian(CX, CY, R + 18, tickAngle);
          return (
            <g key={pct}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#9a9a9a" strokeWidth="1.2" />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor="middle"
                fill="currentColor"
                className="text-[9px] font-semibold opacity-70"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* ponteiro */}
        <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={7} fill={color} />
        <circle cx={CX} cy={CY} r={3} fill="white" />

        {/* numero grande */}
        <text x={CX} y={CY - 22} textAnchor="middle" className="fill-foreground text-[22px] font-bold">
          {stats.marginPct.toFixed(1)}%
        </text>
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border border-border bg-muted/20 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Receita</p>
          <p className="text-xs font-semibold text-foreground">{formatPrice(stats.totalRevenue, { decimals: 2 })}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/20 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Custo</p>
          <p className="text-xs font-semibold text-foreground">{formatPrice(stats.totalCost, { decimals: 2 })}</p>
        </div>
        <div className="rounded-md border p-2" style={{ borderColor: color, backgroundColor: `${color}12` }}>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Lucro</p>
          <p className="text-xs font-semibold" style={{ color }}>
            {formatPrice(stats.profit, { decimals: 2 })}
          </p>
        </div>
      </div>

      {stats.itemsWithoutCost > 0 ? (
        <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
          Atencao: {stats.itemsWithoutCost} de {stats.totalItems} itens sem custo cadastrado - a margem esta
          subestimada. Cadastre o custo no produto para calcular o lucro real.
        </p>
      ) : null}
    </div>
  );
};

export default ProfitGauge;
