"use client";

import { useChartStore } from "@/lib/store/chart-store";
import { formatPrice } from "@/lib/format";
import { SCALP_CAPITAL } from "@/lib/strategies/scalping";

function formatTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}

export function ScalpingPanel() {
  const signal = useChartStore((s) => s.scalpSignal);
  const history = useChartStore((s) => s.scalpHistory);
  const currentPrice = useChartStore((s) => s.currentPrice);

  // Determina el estado de la señal activa
  const status = (() => {
    if (!signal) return "none";
    if (currentPrice > 0 && currentPrice >= signal.takeProfit) return "tp";
    if (currentPrice > 0 && currentPrice <= signal.stopLoss) return "sl";
    return "active";
  })();

  return (
    <div className="flex flex-col border-b border-tv-border text-xs">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-tv-border px-3 py-2">
        <span className="font-semibold text-tv-text">Scalping BTC</span>
        <span className="rounded bg-tv-border px-1.5 py-0.5 text-[10px] text-tv-text-muted">
          ${SCALP_CAPITAL.toLocaleString()} USD
        </span>
      </div>

      {/* Señal activa */}
      <div className="px-3 py-2">
        {status === "none" && (
          <div className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-[18px]">⏳</span>
            <span className="font-medium text-tv-text-muted">
              Esperando señal…
            </span>
            <span className="text-[10px] text-tv-text-muted">
              EMA20/EMA50 · RSI
            </span>
          </div>
        )}

        {status !== "none" && signal && (
          <div className="flex flex-col gap-2">
            {/* Badge de estado */}
            {status === "active" && (
              <div className="flex items-center gap-1.5 rounded bg-tv-green/10 px-2 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-tv-green" />
                <span className="font-semibold text-tv-green">
                  SEÑAL DE COMPRA
                </span>
              </div>
            )}
            {status === "tp" && (
              <div className="flex items-center gap-1.5 rounded bg-tv-green/10 px-2 py-1.5">
                <span className="text-[14px]">✅</span>
                <span className="font-semibold text-tv-green">
                  OBJETIVO ALCANZADO
                </span>
              </div>
            )}
            {status === "sl" && (
              <div className="flex items-center gap-1.5 rounded bg-tv-red/10 px-2 py-1.5">
                <span className="text-[14px]">🛑</span>
                <span className="font-semibold text-tv-red">STOP LOSS</span>
              </div>
            )}

            {/* Datos de la operación */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-tv-text-muted">Entrada</span>
              <span className="text-right font-mono text-tv-text">
                {formatPrice(signal.entryPrice)}
              </span>

              <span className="text-tv-text-muted">Stop Loss</span>
              <div className="flex flex-col items-end">
                <span className="font-mono text-tv-red">
                  {formatPrice(signal.stopLoss)}
                </span>
                <span className="text-[10px] text-tv-red">
                  -${signal.riskUsd.toFixed(2)}
                </span>
              </div>

              <span className="text-tv-text-muted">Objetivo</span>
              <div className="flex flex-col items-end">
                <span className="font-mono text-tv-green">
                  {formatPrice(signal.takeProfit)}
                </span>
                <span className="text-[10px] text-tv-green">
                  +${signal.rewardUsd.toFixed(2)}
                </span>
              </div>

              <span className="text-tv-text-muted">Cant. BTC</span>
              <span className="text-right font-mono text-tv-text">
                {signal.btcQty.toFixed(5)}
              </span>

              <span className="text-tv-text-muted">R/R</span>
              <span className="text-right font-semibold text-tv-text">
                1:{signal.rr.toFixed(1)}
              </span>
            </div>

            {/* Razón de la señal */}
            <div className="rounded bg-tv-border/50 px-2 py-1 text-[10px] text-tv-text-muted">
              {signal.reason}
            </div>

            {/* Hora de la señal */}
            <div className="text-right text-[10px] text-tv-text-muted">
              {formatDate(signal.time)} · {formatTime(signal.time)}
            </div>
          </div>
        )}
      </div>

      {/* Historial de señales */}
      {history.length > 0 && (
        <div className="border-t border-tv-border px-3 py-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tv-text-muted">
            Señales anteriores
          </p>
          <div className="flex flex-col gap-1">
            {[...history].reverse().map((s) => (
              <div
                key={s.time}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-tv-text-muted">
                  {formatDate(s.time)} {formatTime(s.time)}
                </span>
                <span className="font-mono text-tv-text">
                  {formatPrice(s.entryPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
