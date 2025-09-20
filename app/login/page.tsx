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
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground">
      <div className="hidden md:flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center px-6 space-y-3 max-w-md">
          <h2 className="text-4xl font-bold">Billing ISP</h2>
          <p className="text-base">
            Kelola pelanggan, tagihan, dan laporan ISP Anda dengan mudah 🚀
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 sm:px-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border bg-card text-card-foreground rounded-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-left">
                Selamat Datang
              </CardTitle>
              <CardDescription className="text-left text-muted-foreground">
                Masuk ke sistem billing ISP Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                onClick={doLogin}
                disabled={loading}
              >
                {loading ? "Loading..." : "Login"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                © {new Date().getFullYear()} Billing ISP
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
