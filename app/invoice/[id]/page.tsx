"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
}

export type PaymentStatus = "SUCCESS" | "PENDING" | "ERROR";

export interface InvoiceData {
  customer: string;
  number: string;
  email: string;
  date: string; // simpan string, lebih gampang handle JSON
  dueDate: string;
  items: InvoiceItem[];
  status: PaymentStatus;
  imgLogo?: string;
  paymentLink?: string;
}

export default function InvoicePage() {
  const { id } = useParams();

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Invoice #${invoiceData?.number}`;
  }, [invoiceData?.number]);

  const getPaymentById = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/invoice/${id}`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error("Gagal memuat invoice");
      }

      const { data } = await res.json();
      setInvoiceData(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPaymentById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg animate-pulse">
          Loading invoice...
        </p>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 text-lg">
          {error || "Invoice tidak ditemukan"}
        </p>
      </div>
    );
  }

  const total = invoiceData.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div
        className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8 md:p-12"
        id="invoice-content"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                invoiceData.imgLogo ||
                "https://merch.mikrotik.com/cdn/shop/files/512.png?v=1657867177"
              }
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
              <p className="text-gray-500 text-sm">#{invoiceData.number}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-gray-500 text-sm">
            <div className="mb-4 md:mb-0 flex justify-center md:justify-start">
              <span
                className={`text-4xl font-extrabold uppercase px-6 py-3 border-4 rounded-full tracking-wider
                    ${
                      invoiceData.status !== "SUCCESS"
                        ? "text-red-600 border-red-600"
                        : "text-green-600 border-green-600"
                    }`}
                style={{
                  transform: "rotate(-0deg)",
                  display: "inline-block",
                }}
              >
                {invoiceData.status !== "SUCCESS" ? "UNPAID" : "PAID"}
              </span>
            </div>

            <p>
              Invoice Date:{" "}
              {new Date(invoiceData.date).toLocaleDateString("id-ID")}
            </p>
            <p>
              Due Date:{" "}
              {new Date(invoiceData.dueDate).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-gray-700 font-semibold mb-1">Billed To:</h2>
          <p className="text-gray-600">{invoiceData.customer}</p>
          <p className="text-gray-600">{invoiceData.email}</p>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 text-gray-600"
                >
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">{item.qty}</td>
                  <td className="px-4 py-3 text-right">
                    Rp {item.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    Rp {(item.qty * item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-between mt-6">
          <div className="text-lg md:text-xl font-bold text-gray-800">
            Total: Rp {total.toLocaleString()}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            {invoiceData.paymentLink && invoiceData.status !== "SUCCESS" && (
              <button
                onClick={() => {
                  window.open(invoiceData.paymentLink);
                }}
                className="px-3 py-1 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm"
              >
                Bayar Sekarang
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              Download Invoice
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-gray-400 text-sm">
          Thank you for your business!
          <br />
          If you have any questions, contact support@example.com
        </div>
      </div>
    </div>
  );
}
