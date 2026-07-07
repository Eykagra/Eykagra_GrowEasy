import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "growseasy-csv-importer-frontend",
    timestamp: new Date().toISOString(),
  });
}