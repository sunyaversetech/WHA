import { NextRequest } from "next/server";
import { getAuthUser } from "@/server/lib/getAuthUser";
import { anonymizeAndDeleteAccount } from "@/server/lib/accountDeletion";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return mobileError("Unauthorized", 401);
    return mobileOk({ user: authUser });
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
    const authUser = await getAuthUser(req);
    if (!authUser) return mobileError("Unauthorized", 401);

    const deleted = await anonymizeAndDeleteAccount(authUser.id);
    if (!deleted) return mobileError("Account not found", 404);

    return mobileOk({ success: true });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
