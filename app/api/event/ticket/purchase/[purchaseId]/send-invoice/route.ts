import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { sendInvoiceEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { format } from "date-fns";

type RouteContext = {
  params: Promise<{ purchaseId: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId } = await params;

    const purchase = await EventTicketPurchase.findById(purchaseId)
      .populate("user", "name email")
      .populate("event", "title");

    if (!purchase) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (purchase.business.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized for this business." },
        { status: 403 },
      );
    }

    const buyer = purchase.user as any;
    if (!buyer?.email) {
      return NextResponse.json(
        { error: "This order has no buyer email on file" },
        { status: 400 },
      );
    }

    await sendInvoiceEmail(
      buyer.email,
      (purchase.event as any)?.title || "Event",
      buyer.name || "Guest",
      purchase.items.map((i: any) => ({
        optionName: i.optionName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      {
        ticketTotal: purchase.ticketTotal,
        serviceFee: purchase.serviceFee,
        surcharge: purchase.surcharge,
        totalAmount: purchase.totalAmount,
        promoCode: purchase.promoCode,
        invoiceNumber: purchase.invoiceNumber,
      },
      format(new Date(purchase.createdAt), "dd MMM yyyy"),
    );

    return NextResponse.json({ success: true, message: "Invoice sent" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
