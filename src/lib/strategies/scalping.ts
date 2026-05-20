import type { Candle } from "@/lib/binance/types";
import { ema as calcEma, rsi as calcRsi } from "@/lib/indicators";

/** Capital fijo para calcular tamaño de posición */
export const SCALP_CAPITAL = 1500; // USD

const STOP_PCT = 0.005; // 0.5% de stop loss
const TP_PCT = 0.010;   // 1.0% de take profit → ratio 1:2

export interface ScalpSignal {
  time: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  btcQty: number;
  riskUsd: number;
  rewardUsd: number;
  rr: number;
  reason: string;
}

/**
 * Calcula señales de scalping sobre el array completo de velas.
 * Solo evalúa velas CERRADAS (excluye la última, que puede estar viva).
 *
 * Condiciones:
 *  1. RSI rebota desde sobreventa (<38 → ≥38) con EMA20 > EMA50 y precio > EMA20
 *  2. EMA20 cruza por encima de EMA50 con RSI ≥ 48 y vela alcista
 */
export function computeScalpSignals(candles: Candle[]): ScalpSignal[] {
  if (candles.length < 60) return [];

  const e20pts = calcEma(candles, 20);
  const e50pts = calcEma(candles, 50);
  const rsiPts = calcRsi(candles, 14);

  const e20Map = new Map(e20pts.map((p) => [p.time, p.value]));
  const e50Map = new Map(e50pts.map((p) => [p.time, p.value]));
  const rsiMap = new Map(rsiPts.map((p) => [p.time, p.value]));

  const signals: ScalpSignal[] = [];

  // Iteramos hasta length - 1 para omitir la vela viva
  for (let i = 1; i < candles.length - 1; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    const eCur20 = e20Map.get(cur.time);
    const eCur50 = e50Map.get(cur.time);
    const rsiCur = rsiMap.get(cur.time);
    const rsiPrev = rsiMap.get(prev.time);
    const ePrev20 = e20Map.get(prev.time);
    const ePrev50 = e50Map.get(prev.time);

    if (
      eCur20 === undefined ||
      eCur50 === undefined ||
      rsiCur === undefined ||
      rsiPrev === undefined ||
      ePrev20 === undefined ||
      ePrev50 === undefined
    )
      continue;

    let reason: string | null = null;

    // Señal 1: Rebote desde sobreventa en tendencia alcista
    if (
      eCur20 > eCur50 &&
      rsiPrev < 38 &&
      rsiCur >= 38 &&
      cur.close > eCur20
    ) {
      reason = "RSI rebota ↑38 · EMA20 > EMA50";
    }

    // Señal 2: Cruce alcista EMA20/EMA50 con momentum
    if (
      !reason &&
      ePrev20 <= ePrev50 &&
      eCur20 > eCur50 &&
      rsiCur >= 48 &&
      cur.close > cur.open
    ) {
      reason = "EMA20 cruza ↑ EMA50 · RSI ≥ 48";
    }

    if (reason) {
      const entry = cur.close;
      signals.push({
        time: cur.time,
        entryPrice: entry,
        stopLoss: entry * (1 - STOP_PCT),
        takeProfit: entry * (1 + TP_PCT),
        btcQty: SCALP_CAPITAL / entry,
        riskUsd: SCALP_CAPITAL * STOP_PCT,
        rewardUsd: SCALP_CAPITAL * TP_PCT,
        rr: TP_PCT / STOP_PCT,
        reason,
      });
    }
  }

  return signals;
}
