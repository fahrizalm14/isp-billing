"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BandwidthData = {
  time: string;
  rx: number;
  tx: number;
};

function formatBitsPerSecond(val: number): string {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + " Gbps";
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + " Mbps";
  if (val >= 1_000) return (val / 1_000).toFixed(2) + " Kbps";
  return val + " bps";
}

// Hook animasi angka agar smooth (fixed: dependency array selalu stabil)
function useAnimatedNumber(value: number | undefined, duration = 500) {
  const [display, setDisplay] = useState(value ?? 0);
  const rafRef = useRef<number>(0);
  const fromRef = useRef(0);
  const targetRef = useRef<number | undefined>(value);
  const startTimeRef = useRef(0);
  const displayRef = useRef(display);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (typeof value !== "number") return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // nilai awal animasi = display terakhir, target baru = value
    fromRef.current = displayRef.current;
    targetRef.current = value;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const target = targetRef.current ?? 0;
      const next = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]); // panjang dependencies sekarang selalu konstan (2)

  return display;
}

export default function BandwidthChart({
  routerId,
  interfaces,
}: {
  routerId: string;
  interfaces: string;
}) {
  const [data, setData] = useState<BandwidthData[]>([]);

  useEffect(() => {
    if (!routerId || !interfaces) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/router/mikrotik/${routerId}/bandwidth?interface=${interfaces}`
        );
        const json = await res.json();
        if (!cancelled && json.success) {
          const now = new Date().toLocaleTimeString();
          const newEntry = { time: now, rx: json.rx, tx: json.tx };
          setData((prev) => {
            const updated = [...prev, newEntry];
            // inline 20 (MAX_POINTS sebelumnya)
            return updated.length > 20
              ? updated.slice(updated.length - 20)
              : updated;
          });
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch bandwidth:", err);
      }
    };

    tick(); // initial
    // inline 6000 (POLL_INTERVAL sebelumnya)
    const intervalId = setInterval(tick, 6000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [interfaces, routerId]);

  // ---------- NEW: helper & latest value extraction ----------
  const toMBperSec = (bps: number) => {
    // konversi bps -> MB/s (1 byte = 8 bits)
    return bps / 8 / 1_000_000;
  };
  // const formatMB = (bps?: number) =>
  //   typeof bps === "number" ? `${toMBperSec(bps).toFixed(2)} MB/s` : "—";

  const latest = data.length ? data[data.length - 1] : null;
  // -----------------------------------------------------------

  // ---------- CHANGED: animated overlay values ----------
  const latestRx = typeof latest?.rx === "number" ? latest.rx : undefined;
  const latestTx = typeof latest?.tx === "number" ? latest.tx : undefined;
  const animatedRx = useAnimatedNumber(latestRx);
  const animatedTx = useAnimatedNumber(latestTx);
  // gunakan nilai animasi untuk overlay
  const animatedRxMB =
    typeof animatedRx === "number" ? toMBperSec(animatedRx) : 0;
  const animatedTxMB =
    typeof animatedTx === "number" ? toMBperSec(animatedTx) : 0;
  // ------------------------------------------------------

  // ---------- CHANGED: label renderer (memo, tiap 3 titik) ----------
  const createTopLabel = useCallback(
    (color: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/display-name
      (props: any) => {
        const { x, y, value, index } = props;
        if (index % 3 !== 0) return null;
        if (typeof value !== "number" || Number.isNaN(value)) return null;
        const mbps = value / 1_000_000;
        const xNum = Number(x) || 0;
        const yNum = Number(y) || 0;
        return (
          <text
            x={xNum}
            y={yNum - 8}
            fill={color}
            fontSize={11}
            textAnchor="middle"
            style={{ pointerEvents: "none" }}
          >
            {mbps.toFixed(2)} Mbps
          </text>
        );
      },
    []
  );

  const rxLabelContent = useMemo(
    () => createTopLabel("#8884d8"),
    [createTopLabel]
  );
  const txLabelContent = useMemo(
    () => createTopLabel("#82ca9d"),
    [createTopLabel]
  );
  // ---------------------------------------------------------------

  return (
    <div className="w-full h-[370px]">
      {/* NEW: wrapper relative supaya overlay bisa ditempatkan tepat di atas chart */}
      <div className="relative w-full h-full">
        {/* overlay: tepat di atas area (centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10">
          <div className="inline-flex items-center gap-4 bg-black/55 backdrop-blur-sm text-white text-xs px-4 py-1.5 rounded-md shadow transition">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8884d8]" />
              <span className="font-medium">RX:</span>
              <span className="tabular-nums">
                {latestRx != null ? `${animatedRxMB.toFixed(2)} MB/s` : "—"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#82ca9d]" />
              <span className="font-medium">TX:</span>
              <span className="tabular-nums">
                {latestTx != null ? `${animatedTxMB.toFixed(2)} MB/s` : "—"}
              </span>
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 40, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" hide /> {/* waktu di bawah disembunyikan */}
            <YAxis
              orientation="right"
              width={84}
              tickMargin={4}
              tickFormatter={(val) => formatBitsPerSecond(val)}
            />
            <Tooltip
              formatter={(val: number) => formatBitsPerSecond(val)}
              labelFormatter={(label) => `Waktu: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="rx"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.25}
              name="RX"
              isAnimationActive={false}
            >
              <LabelList dataKey="rx" content={rxLabelContent} />
            </Area>
            <Area
              type="monotone"
              dataKey="tx"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.25}
              name="TX"
              isAnimationActive={false}
            >
              <LabelList dataKey="tx" content={txLabelContent} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BandwidthChart as any).displayName = "BandwidthChart"; // (removed duplicate)
