import { NextRequest } from "next/server";
import { getAuthUserDetailed, type AuthRejectReason } from "@/server/lib/getAuthUser";
import { anonymizeAndDeleteAccount } from "@/server/lib/accountDeletion";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

// See 04-api-reference.md's Error Codes section — ACCOUNT_BLOCKED is 403 (the
// account is real but rejected); ACCOUNT_NOT_FOUND and TOKEN_INVALID are both 401
// (nothing to authenticate as / not authenticated at all).
function statusForReason(reason: AuthRejectReason): number {
  return reason === "ACCOUNT_BLOCKED" ? 403 : 401;
}

export async function GET(req: NextRequest) {
  try {
    const result = await getAuthUserDetailed(req);
    if (!result.user) {
      return mobileError("Unauthorized", statusForReason(result.reason), null, result.reason);
    }
    return mobileOk({ user: result.user });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}

/**
 * Account deletion (App Store/Play Store requirement). Anonymizes in place rather
 * than hard-deleting — see server/lib/accountDeletion.ts for why (existing
 * Booking/EventTicketPurchase/Review references would otherwise dangle).
 */
export async function DELETE(req: NextRequest) {
  try {
    const result = await getAuthUserDetailed(req);
    if (!result.user) {
      return mobileError("Unauthorized", statusForReason(result.reason), null, result.reason);
    }

    const deleted = await anonymizeAndDeleteAccount(result.user.id);
    if (!deleted) {
      return mobileError("Account not found", 401, null, "ACCOUNT_NOT_FOUND");
    }

    return mobileOk({ success: true });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
