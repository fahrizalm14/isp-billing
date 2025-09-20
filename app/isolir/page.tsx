"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function IsolirPage() {
  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden">
      <div className="w-full m-auto sm:max-w-lg px-4">
        <Card className="shadow-xl border-red-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-red-600">
              Layanan Dinonaktifkan
            </CardTitle>
            <CardDescription className="text-center text-gray-700">
              Internet Anda saat ini <b>terisolir</b>. Silakan hubungi admin
              untuk mengaktifkan kembali layanan.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            {/* Ilustrasi / Icon */}
            <div className="flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-red-500 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hubungi Admin
              </a>
            </Button>

            <p className="text-xs text-gray-500 text-center">
              © 2025 ISP Anda – Semua Hak Dilindungi
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
