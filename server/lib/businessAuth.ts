import { NextResponse } from "next/server";
import type { AuthUser } from "./authUser";
import { bearerRejectionResponse, getAuthUserDetailed } from "./getAuthUser";

// Business-dashboard routes: one identity check for both the web session cookie and
// the mobile app's bearer token (via getAuthUserDetailed — bearer first, then the
// NextAuth session; both re-read the user and reject blocked/deleted accounts), plus
// a server-side category check.
//
// Web (cookie / no credentials) rejections keep each route's own pre-existing body
// and status, passed in as `webUnauthorized`. Only the bearer path gets the coded
// `{ [messageKey]: { message, code } }` shape, exactly like the swapped consumer
// routes (see bearerRejectionResponse).

type MessageKey = "error" | "message";

export const NOT_BUSINESS_MESSAGE = "This is only available to business accounts.";

export type BusinessAuthResult =
  | { user: AuthUser; viaBearer: boolean; response?: undefined }
  | { user: null; viaBearer: boolean; response: NextResponse };

export interface BusinessAuthOptions {
  /** Top-level key the route already uses for error strings. Default "error". */
  messageKey?: MessageKey;
  /** The route's existing web 401 body. Default `{ [messageKey]: "Unauthorized" }`. */
  webUnauthorized?: Record<string, unknown>;
  /**
   * Body + status for a signed-in non-business account on the web path. Routes that
   * already checked the category keep their old response here (they returned it
   * together with the unauthenticated case). Default 403 `{ [messageKey]: "Forbidden" }`.
   */
  webNotBusiness?: { body: Record<string, unknown>; status: number };
  /** Let super-admin through — only where the web already allows super-admin. */
  allowSuperAdmin?: boolean;
}

export async function requireBusinessUser(
  req: Request,
  options: BusinessAuthOptions = {},
): Promise<BusinessAuthResult> {
  const key = options.messageKey ?? "error";
  const auth = await getAuthUserDetailed(req);

  if (!auth.user) {
    const response = auth.viaBearer
      ? bearerRejectionResponse(auth.reason, key)
      : NextResponse.json(options.webUnauthorized ?? { [key]: "Unauthorized" }, {
          status: 401,
        });
    return { user: null, viaBearer: auth.viaBearer, response };
  }

  const { category } = auth.user;
  const allowed =
    category === "business" || (options.allowSuperAdmin === true && category === "super-admin");
  if (!allowed) {
    const response = auth.viaBearer
      ? NextResponse.json(
          { [key]: { message: NOT_BUSINESS_MESSAGE, code: "NOT_BUSINESS" } },
          { status: 403 },
        )
      : NextResponse.json(options.webNotBusiness?.body ?? { [key]: "Forbidden" }, {
          status: options.webNotBusiness?.status ?? 403,
        });
    return { user: null, viaBearer: auth.viaBearer, response };
  }

  return { user: auth.user, viaBearer: auth.viaBearer };
}
