"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  QrCode,
  RefreshCw,
  Smartphone,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import QRCodeLib from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

type SessionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "QR"
  | "LOGGED_OUT"
  | "ERROR";

// Badge component inline
const Badge = ({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        variants[variant]
      } ${className || ""}`}
    >
      {children}
    </span>
  );
};

const WhatsAppSettings = () => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");
  const [isConnected, setIsConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const eventSourceRef = useRef<EventSource | null>(null);

  // Check session status
  const checkSessionStatus = useCallback(async (key: string) => {
    if (!key) return;

    try {
      setLoading(true);
      const baseUrl =
        localStorage.getItem("whatsapp_base_url") || "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/v1/whatsapp/sessions/${key}/status`
      );

      if (!res.ok) throw new Error("Failed to check status");

      const result = await res.json();
      if (result.status === "success" && result.data) {
        setSessionStatus(result.data.status);
        setIsConnected(result.data.connected);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      SwalToast.fire({
        title: "Gagal memeriksa status",
        text: (error as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load API key from localStorage
  const loadStoredApiKey = useCallback(() => {
    const stored = localStorage.getItem("whatsapp_api_key");
    if (stored) {
      setApiKey(stored);
      checkSessionStatus(stored);
    }
  }, [checkSessionStatus]);

  // Load stored values on mount
  useEffect(() => {
    // Load base URL
    const storedBaseUrl = localStorage.getItem("whatsapp_base_url");
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }

    // Load API key
    loadStoredApiKey();
  }, [loadStoredApiKey]);

  // Generate API Key
  const handleGenerateApiKey = async () => {
    if (!secretKey) {
      SwalToast.fire({
        title: "Secret Key diperlukan",
        icon: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const baseUrl =
        localStorage.getItem("whatsapp_base_url") || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/v1/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": secretKey,
        },
        body: JSON.stringify({ label: "ISP Billing" }),
      });

      if (!res.ok) throw new Error("Failed to generate API key");

      const result = await res.json();
      if (result.status === "success" && result.data) {
        const newKey = result.data.key;
        setApiKey(newKey);
        localStorage.setItem("whatsapp_api_key", newKey);
        SwalToast.fire({
          title: "API Key berhasil dibuat",
          icon: "success",
        });
      }
    } catch (error) {
      SwalToast.fire({
        title: "Gagal membuat API Key",
        text: (error as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Request QR Code and setup SSE
  const handleRequestQR = async () => {
    if (!apiKey) {
      SwalToast.fire({
        title: "API Key diperlukan",
        icon: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const baseUrl =
        localStorage.getItem("whatsapp_base_url") || "http://localhost:3000";

      // Close existing SSE connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Setup SSE for real-time updates
      setupSSE(apiKey, baseUrl);

      // Request QR code
      const res = await fetch(
        `${baseUrl}/api/v1/whatsapp/sessions/${apiKey}/qr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: displayName || "ISP Billing" }),
        }
      );

      if (!res.ok) throw new Error("Failed to request QR code");

      const result = await res.json();
      if (result.status === "success" && result.data) {
        setSessionStatus(result.data.status);
        if (result.data.qr) {
          await generateQRImage(result.data.qr);
        }
      }
    } catch (error) {
      SwalToast.fire({
        title: "Gagal meminta QR Code",
        text: (error as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup Server-Sent Events
  const setupSSE = (key: string, baseUrl: string) => {
    const es = new EventSource(
      `${baseUrl}/api/v1/whatsapp/sessions/${key}/stream`
    );

    es.addEventListener("status", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setSessionStatus(data.status);
    });

    es.addEventListener("qr", async (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.qr) {
        await generateQRImage(data.qr);
      }
    });

    es.addEventListener("connected", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setSessionStatus("CONNECTED");
      setIsConnected(true);
      setQrCodeUrl("");
      SwalToast.fire({
        title: "WhatsApp Terhubung!",
        text: data.message || "Sesi berhasil terhubung",
        icon: "success",
      });
      es.close();
    });

    es.onerror = () => {
      console.error("SSE connection error");
      es.close();
    };

    eventSourceRef.current = es;
  };

  // Generate QR code image
  const generateQRImage = async (qrText: string) => {
    try {
      const url = await QRCodeLib.toDataURL(qrText, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  // Logout session
  const handleLogout = async () => {
    if (!apiKey) return;

    try {
      setLoading(true);
      const baseUrl =
        localStorage.getItem("whatsapp_base_url") || "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/v1/whatsapp/sessions/${apiKey}/logout`,
        {
          method: "POST",
        }
      );

      if (!res.ok) throw new Error("Failed to logout");

      const result = await res.json();
      if (result.status === "success") {
        // Clear state
        setSessionStatus("LOGGED_OUT");
        setIsConnected(false);
        setQrCodeUrl("");
        setApiKey("");

        // Remove API key from localStorage
        localStorage.removeItem("whatsapp_api_key");

        // Close SSE connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        SwalToast.fire({
          title: "Logout berhasil",
          text: "API Key telah dihapus",
          icon: "success",
        });
      }
    } catch (error) {
      SwalToast.fire({
        title: "Gagal logout",
        text: (error as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Get status badge
  const getStatusBadge = () => {
    switch (sessionStatus) {
      case "CONNECTED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Terhubung
          </Badge>
        );
      case "QR":
        return (
          <Badge className="bg-blue-500">
            <QrCode className="w-3 h-3 mr-1" />
            Scan QR Code
          </Badge>
        );
      case "DISCONNECTED":
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Terputus
          </Badge>
        );
      case "LOGGED_OUT":
        return (
          <Badge variant="outline">
            <LogOut className="w-3 h-3 mr-1" />
            Logged Out
          </Badge>
        );
      case "ERROR":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <CardTitle>WhatsApp Connection</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Kelola koneksi WhatsApp untuk broadcast dan notifikasi otomatis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Base URL Config */}
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL (optional)</Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="http://localhost:3000"
            value={baseUrl}
            onChange={(e) => {
              setBaseUrl(e.target.value);
              localStorage.setItem("whatsapp_base_url", e.target.value);
            }}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            URL server WhatsApp API. Default: http://localhost:3000
          </p>
        </div>

        {/* Generate API Key Section */}
        {!apiKey && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <Label htmlFor="secretKey">Secret Key</Label>
            <div className="flex gap-2">
              <Input
                id="secretKey"
                type="password"
                placeholder="Masukkan secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleGenerateApiKey}
                disabled={loading || !secretKey}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate API key baru untuk mulai menggunakan WhatsApp
            </p>
          </div>
        )}

        {/* API Key Display */}
        {apiKey && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* Display Name */}
        {apiKey && !isConnected && (
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (optional)</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="ISP Billing"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* QR Code Display */}
        {qrCodeUrl && (
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
            <Image
              src={qrCodeUrl}
              alt="QR Code"
              width={256}
              height={256}
              className="w-64 h-64"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Scan QR code dengan WhatsApp
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {apiKey && (
          <div className="flex gap-2 flex-wrap">
            {!isConnected && (
              <Button
                onClick={handleRequestQR}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Request QR Code
              </Button>
            )}

            <Button
              onClick={() => checkSessionStatus(apiKey)}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            {isConnected && (
              <Button
                onClick={handleLogout}
                disabled={loading}
                variant="destructive"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Logout
              </Button>
            )}
          </div>
        )}

        {/* Status Info */}
        {apiKey && (
          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p>Status: {sessionStatus}</p>
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppSettings;
