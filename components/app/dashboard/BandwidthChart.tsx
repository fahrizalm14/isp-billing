"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/router/mikrotik/${routerId}/bandwidth?interface=${interfaces}`
        );
        const json = await res.json();

        if (json.success) {
          const now = new Date().toLocaleTimeString();
          const newEntry = {
            time: now,
            rx: json.rx, // nilai sudah dalam bps
            tx: json.tx,
          };

          setData((prev) => {
            const updated = [...prev, newEntry];
            return updated.length > 20
              ? updated.slice(updated.length - 20)
              : updated;
          });
        }
      } catch (err) {
        console.error("Failed to fetch bandwidth:", err);
      }
    }, 6000); // polling setiap 3s

    return () => clearInterval(interval);
  }, [interfaces, routerId]);

  return (
    <div className="w-full h-[370px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            orientation="right"
            width={80}
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
            fillOpacity={0.3}
            name="RX"
          />
          <Area
            type="monotone"
            dataKey="tx"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.3}
            name="TX"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
