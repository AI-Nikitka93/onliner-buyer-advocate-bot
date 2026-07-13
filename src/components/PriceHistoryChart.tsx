import React, { useState } from "react";
import { TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, Info } from "lucide-react";
import type { PriceHistoryPoint as ProductPriceHistoryPoint } from "../types";

interface PricePoint {
  label: string;
  price: number;
  isSpike: boolean;
  date?: string;
}

interface PriceHistoryChartProps {
  currentPrice: number;
  originalPrice: number;
  medianPrice90Days: number;
  isFakeDiscount: boolean;
  productTitle: string;
  medianWindowLabel?: string;
  priceHistory?: ProductPriceHistoryPoint[];
}

function formatHistoryLabel(date: string): string {
  const parts = date.split("-");
  if (parts.length >= 3) return `${parts[2]}.${parts[1]}`;
  if (parts.length === 2) return `${parts[1]}.${parts[0].slice(2)}`;
  return date;
}

function normalizeHistory(
  history: ProductPriceHistoryPoint[] | undefined,
  currentPrice: number,
  medianPrice: number,
): PricePoint[] {
  const points = (history || [])
    .filter((point) => point.price > 0 && point.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return points.map((point, index) => {
    const isLast = index === points.length - 1;
    const isSpike = medianPrice > 0 && point.price > medianPrice * 1.12 && point.price > currentPrice * 1.08;
    return {
      label: isLast ? `сейчас (${formatHistoryLabel(point.date)})` : formatHistoryLabel(point.date),
      price: point.price,
      isSpike,
      date: point.date,
    };
  });
}

function generateFallbackData(
  currentPrice: number,
  originalPrice: number,
  medianPrice90Days: number,
  isFakeDiscount: boolean,
): PricePoint[] {
  if (isFakeDiscount) {
    return [
      { label: "90 дн.", price: medianPrice90Days, isSpike: false },
      { label: "75 дн.", price: medianPrice90Days + 15, isSpike: false },
      { label: "45 дн.", price: medianPrice90Days - 10, isSpike: false },
      { label: "30 дн.", price: medianPrice90Days - 5, isSpike: false },
      { label: "14 дн.", price: originalPrice, isSpike: true },
      { label: "7 дн.", price: originalPrice, isSpike: true },
      { label: "сейчас", price: currentPrice, isSpike: false },
    ];
  }

  return [
    { label: "90 дн.", price: medianPrice90Days - 10, isSpike: false },
    { label: "75 дн.", price: medianPrice90Days + 10, isSpike: false },
    { label: "45 дн.", price: medianPrice90Days, isSpike: false },
    { label: "30 дн.", price: medianPrice90Days + 5, isSpike: false },
    { label: "14 дн.", price: medianPrice90Days - 5, isSpike: false },
    { label: "7 дн.", price: medianPrice90Days - 5, isSpike: false },
    { label: "сейчас", price: currentPrice, isSpike: false },
  ];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function PriceHistoryChart({
  currentPrice,
  originalPrice,
  medianPrice90Days,
  isFakeDiscount,
  productTitle,
  medianWindowLabel,
  priceHistory,
}: PriceHistoryChartProps) {
  const realHistory = normalizeHistory(priceHistory, currentPrice, medianPrice90Days);
  const isRealHistory = realHistory.length >= 2;
  const data = isRealHistory
    ? realHistory
    : generateFallbackData(currentPrice, originalPrice, medianPrice90Days, isFakeDiscount);

  const prices = data.map((d) => d.price);
  const minBase = Math.min(...prices, currentPrice, medianPrice90Days);
  const maxBase = Math.max(...prices, currentPrice, originalPrice, medianPrice90Days);
  const padding = Math.max(1, (maxBase - minBase) * 0.12);
  const minPrice = Math.max(0, minBase - padding);
  const maxPrice = maxBase + padding;
  const priceRange = Math.max(1, maxPrice - minPrice);

  const height = 180;
  const width = 500;
  const paddingX = 40;
  const paddingY = 20;

  const pointsCoords = data.map((d, i) => {
    const ratio = data.length === 1 ? 0.5 : i / (data.length - 1);
    const x = paddingX + ratio * (width - paddingX * 2);
    const y = height - paddingY - ((d.price - minPrice) / priceRange) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = pointsCoords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaD = `${pathD} L ${pointsCoords[pointsCoords.length - 1].x} ${height - paddingY} L ${pointsCoords[0].x} ${height - paddingY} Z`;

  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const firstPoint = data[0];
  const middlePoint = data[Math.floor(data.length / 2)];
  const lastPoint = data[data.length - 1];
  const minPoint = data.reduce((best, point) => (point.price < best.price ? point : best), data[0]);
  const maxPoint = data.reduce((best, point) => (point.price > best.price ? point : best), data[0]);
  const deltaFromMedian = medianPrice90Days > 0 ? round1(((medianPrice90Days - currentPrice) / medianPrice90Days) * 100) : 0;
  const trendFromFirst = firstPoint.price > 0 ? round1(((firstPoint.price - lastPoint.price) / firstPoint.price) * 100) : 0;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-1.5">
            <TrendingUp className={`w-4 h-4 ${isFakeDiscount ? "text-rose-400" : "text-emerald-400"}`} />
            <h5 className="text-sm font-bold text-slate-200">Ценовая история и медианный ориентир</h5>
          </div>
          <p className="text-[10px] text-slate-400">
            {isRealHistory ? "Реальные точки из графика минимальных цен Onliner" : "Нет графика Onliner: показана только локальная иллюстрация риска"}
          </p>
        </div>

        {isRealHistory ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> История Onliner
          </span>
        ) : isFakeDiscount ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Риск накрутки
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Медианный ориентир
          </span>
        )}
      </div>

      <div className="relative mt-2" aria-label={`График истории цены: ${productTitle}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="gradient-fake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-real" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1e293b" strokeWidth="1.5" />
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />

          <path d={areaD} fill={`url(#${isFakeDiscount ? "gradient-fake" : "gradient-real"})`} />
          <path
            d={pathD}
            fill="none"
            stroke={isFakeDiscount ? "rgb(244, 63, 94)" : "rgb(16, 185, 129)"}
            strokeWidth="3.2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {pointsCoords.map((p, i) => {
            const isHovered = activePointIndex === i;
            const tooltipX = p.x - 60 < paddingX ? paddingX : p.x + 60 > width - paddingX ? width - paddingX - 120 : p.x - 60;
            const tooltipTextX = p.x - 60 < paddingX ? paddingX + 60 : p.x + 60 > width - paddingX ? width - paddingX - 60 : p.x;
            const tooltipY = p.y - 45 < 5 ? p.y + 15 : p.y - 42;
            const tooltipPriceY = p.y - 45 < 5 ? p.y + 27 : p.y - 28;
            const tooltipLabelY = p.y - 45 < 5 ? p.y + 39 : p.y - 16;

            return (
              <g
                key={`${p.date || p.label}-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setActivePointIndex(i)}
                onMouseLeave={() => setActivePointIndex(null)}
              >
                {isHovered && (
                  <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                )}

                {p.isSpike && (
                  <circle cx={p.x} cy={p.y} r="8" fill="rgb(239, 68, 68)" opacity="0.4" className="animate-ping" />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "7" : p.isSpike ? "5" : "4.5"}
                  fill={p.isSpike ? "#ef4444" : isFakeDiscount ? "#f43f5e" : "#10b981"}
                  stroke="#020617"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {isHovered && (
                  <g>
                    <rect x={tooltipX} y={tooltipY} width="120" height="32" rx="8" fill="#0b1329" stroke="#334155" strokeWidth="1.5" />
                    <text x={tooltipTextX} y={tooltipPriceY} textAnchor="middle" fill="#f1f5f9" fontSize="9.5" fontWeight="bold">
                      {p.price} BYN
                    </text>
                    <text x={tooltipTextX} y={tooltipLabelY} textAnchor="middle" fill="#94a3b8" fontSize="8">
                      {p.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
            {Math.round(maxPrice)} BYN
          </text>
          <text x={paddingX - 10} y={height / 2 + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
            {Math.round(minPrice + priceRange / 2)} BYN
          </text>
          <text x={paddingX - 10} y={height - paddingY + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
            {Math.round(minPrice)} BYN
          </text>

          <text x={paddingX} y={height - paddingY + 12} textAnchor="middle" fill="#475569" fontSize="8">
            {firstPoint.label}
          </text>
          <text x={width / 2} y={height - paddingY + 12} textAnchor="middle" fill="#475569" fontSize="8">
            {middlePoint.label}
          </text>
          <text x={width - paddingX} y={height - paddingY + 12} textAnchor="middle" fill="#475569" fontSize="8">
            {lastPoint.label}
          </text>
        </svg>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-5">
        <div className="space-y-1 text-slate-300">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Что показывают факты:</div>
          {isRealHistory ? (
            <p className={`${deltaFromMedian >= 0 ? "text-emerald-300" : "text-amber-300"} flex items-start gap-1`}>
              {deltaFromMedian >= 0 ? (
                <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span>
                Onliner вернул <strong>{data.length}</strong> замеров цены: минимум <strong>{minPoint.price} BYN</strong>, максимум <strong>{maxPoint.price} BYN</strong>.
                Текущая цена {deltaFromMedian >= 0 ? "ниже" : "выше"} медианы на <strong>{Math.abs(deltaFromMedian)}%</strong>;
                движение от первой точки: <strong>{trendFromFirst}%</strong>.
              </span>
            </p>
          ) : isFakeDiscount ? (
            <p className="text-red-300 flex items-start gap-1">
              <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-bounce" />
              <span>Без графика Onliner это предварительный риск: заявленная цена до скидки <strong>{originalPrice} BYN</strong>, текущая <strong>{currentPrice} BYN</strong>.</span>
            </p>
          ) : (
            <p className="text-emerald-300 flex items-start gap-1">
              <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <span>Текущая цена <strong>{currentPrice} BYN</strong> ниже медианного ориентира <strong>{medianPrice90Days} BYN</strong>, но без графика это не полное доказательство истории.</span>
            </p>
          )}
        </div>

        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2 text-[11px] text-slate-400">
          <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-300 block">Источник медианы</span>
            <span>{medianWindowLabel || "источник истории не подтвержден"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
