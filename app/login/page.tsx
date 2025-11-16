"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import { useWebsiteInfoStore } from "@/stores/useWebsiteInfoStore";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Lock, Mail, Shield, Wifi, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, id } = useUserStore();
  const { setWebsiteInfo } = useWebsiteInfoStore();

  useEffect(() => {
    if (id) router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async () => {
    if (!email || !password) {
      SwalToast.fire({
        icon: "warning",
        title: "Email dan password wajib diisi",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { token, websiteInfo } = await res.json();
        const decoded = jwtDecode<{
          id: string;
          name: string;
          email: string;
          role: string;
        }>(token);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        });
        setWebsiteInfo(websiteInfo);
        router.replace("/dashboard");
        SwalToast.fire({
          icon: "success",
          title: "Login berhasil",
          timer: 1500,
        });
      } else {
        const data = await res.json();
        SwalToast.fire({ icon: "error", title: data.message || "Login gagal" });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({ icon: "error", title: "Terjadi kesalahan saat login" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05]" />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left side - Branding */}
        <div className="hidden lg:flex items-center justify-center p-12">
          <div className="max-w-lg space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ISP Billing System
                </span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                Kelola ISP Anda dengan
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mudah & Cepat
                </span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Sistem billing modern untuk mengelola pelanggan, tagihan, dan
                laporan ISP Anda secara efisien.
              </p>
            </div>

            <div className="grid gap-4 pt-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:scale-105 transition-transform duration-300">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Otomatis & Real-time
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pengelolaan tagihan dan notifikasi otomatis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:scale-105 transition-transform duration-300">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Aman & Terpercaya
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Data terenkripsi dengan keamanan tingkat enterprise
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md animate-slide-up">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Billing ISP
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Sistem manajemen modern
              </p>
            </div>

            <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Selamat Datang
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Masukkan kredensial Anda untuk melanjutkan
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doLogin()}
                      className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doLogin()}
                      className="pl-12 pr-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={doLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    "Masuk ke Dashboard"
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()} Billing ISP. All rights reserved.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }

        .bg-grid-slate-900\/\[0\.04\] {
          background-image: linear-gradient(
              to right,
              rgb(15 23 42 / 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgb(15 23 42 / 0.04) 1px,
              transparent 1px
            );
          background-size: 24px 24px;
        }

        .dark .bg-grid-slate-400\/\[0\.05\] {
          background-image: linear-gradient(
              to right,
              rgb(148 163 184 / 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgb(148 163 184 / 0.05) 1px,
              transparent 1px
            );
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}
