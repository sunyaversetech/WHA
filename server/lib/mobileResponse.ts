import { NextResponse } from "next/server";

// Every /api/mobile/v1/* route responds with this one envelope shape, per the
// "standardize only the new namespace, don't retrofit the other 107 routes" decision
// in the mobile gap report.
export function mobileOk<T>(
  data: T,
  meta: Record<string, unknown> | null = null,
  status: number = 200,
) {
  return NextResponse.json({ data, error: null, meta }, { status });
}

// `code` is a stable, machine-readable string (e.g. "ACCOUNT_BLOCKED") the mobile
// client can switch on without parsing `message` — see 04-api-reference.md's Error
// Codes section for the full list.
export function mobileError(
  message: string,
  status: number,
  meta: Record<string, unknown> | null = null,
  code?: string,
) {
  return NextResponse.json(
    { data: null, error: { message, code: code ?? null }, meta },
    { status },
  );
}
