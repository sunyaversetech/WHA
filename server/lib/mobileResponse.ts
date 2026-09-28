import { NextResponse } from "next/server";

// Every /api/mobile/v1/* route responds with this one envelope shape, per the
// "standardize only the new namespace, don't retrofit the other 107 routes" decision
// in the mobile gap report.
export function mobileOk<T>(data: T, meta: Record<string, unknown> | null = null) {
  return NextResponse.json({ data, error: null, meta });
}

export function mobileError(
  message: string,
  status: number,
  meta: Record<string, unknown> | null = null,
) {
  return NextResponse.json(
    { data: null, error: { message }, meta },
    { status },
  );
}
