/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // For now, just console log. Hook up to your logging platform later.
    console.error('Client error log:', body);
  } catch(error: any) {
    console.warn(error);
  }
  return NextResponse.json({ ok: true });
}


