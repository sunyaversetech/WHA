"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";
import {
  useGetEventRedeem,
  useGetEventRedeemBusiness,
} from "@/services/event.service";

interface EventStats {
  eventId: string;
  eventName: string;
  totalRedeemed: number;
  totalVerified: number;
}

export default function EventRedemptionTable() {
  const { data, isLoading } = useGetEventRedeemBusiness();

  console.log(data);

  const aggregateStats = (): EventStats[] => {
    if (!data?.data) return [];

    const statsMap: Record<string, EventStats> = {};

    data.data.forEach((redemption: any) => {
      const eventId = redemption.event?._id || redemption.event;
      const eventName = redemption.event?.title || "Unknown Event";

      if (!statsMap[eventId]) {
        statsMap[eventId] = {
          eventId,
          eventName,
          totalRedeemed: 0,
          totalVerified: 0,
        };
      }

      statsMap[eventId].totalRedeemed += 1;
      if (redemption.status === "verified") {
        statsMap[eventId].totalVerified += 1;
      }
    });

    return Object.values(statsMap);
  };

  const stats = aggregateStats();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full shadow-sm border-none bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-blue-600" />
          Event Redemption Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-[#051e3a]">
                  Event Name
                </TableHead>
                <TableHead className="text-center font-bold text-[#051e3a]">
                  Total Redeemed
                </TableHead>
                <TableHead className="text-center font-bold text-[#051e3a]">
                  Total Verified
                </TableHead>
                <TableHead className="text-right font-bold text-[#051e3a]">
                  Conversion
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length > 0 ? (
                stats.map((event) => (
                  <TableRow
                    key={event.eventId}
                    className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">
                      {event.eventName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                        {event.totalRedeemed} Tickets
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-700">
                          {event.totalVerified}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {event.totalRedeemed > 0
                          ? `${Math.round((event.totalVerified / event.totalRedeemed) * 100)}%`
                          : "0%"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground">
                    No redemption data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
