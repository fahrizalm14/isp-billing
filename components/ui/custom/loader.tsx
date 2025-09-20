"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import LoadingBar from "react-top-loading-bar";

const themeColorMap: Record<string, string> = {
  light: "#4f46e5",
  dark: "#facc15",
  custom: "#14b8a6",
  black: "#f5f5f5",
  "dark-blue": "#3b82f6",
  "dark-teal": "#0d9488",
  mint: "#10b981",
  sunlit: "#f97316",
};

const Loader = ({ loading }: { loading?: boolean }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (loading) {
      ref.current.continuousStart();
    } else {
      ref.current.complete();
    }
  }, [loading]);

  if (!mounted) {
    // Render placeholder agar SSR & CSR cocok
    return <div style={{ height: 3 }} />;
  }

  const barColor = themeColorMap[theme ?? "light"] ?? "#4f46e5";

  return <LoadingBar color={barColor} ref={ref} height={3} shadow />;
};

export default Loader;
