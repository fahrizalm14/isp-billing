import { createCashFlow, getCashFlows } from "@/lib/cashFlow";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const data = await getCashFlows({ limit, page, search });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[GET][CASH-FLOWS]", error);
    return NextResponse.json(
      { error: "Failed to fetch cashflow" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const data = await createCashFlow({ ...body, date: new Date(body.date) });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST][CASH-FLOWS]", error);
    return NextResponse.json(
      { error: "Failed to create cashflow" },
      { status: 500 }
    );
  }
}
