"use client";

import { useGetDealsRedemption } from "@/services/deal.service";
import { useParams } from "next/navigation";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const RedemtionTable = () => {
  const params = useParams();
  const { data, isLoading } = useGetDealsRedemption(params.id as string);

  console.log("Redemption Data:", data);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <div className="p-4">Loading redemptions...</div>;
  if (!data) return <div className="p-4">No data found.</div>;

  return (
    <>
      <Link
        href={`/dashboard/deals/verify-deal?id=${params.id}`}
        className="ml-auto flex bg-[#041e3a] w-35 text-sm text-white items-center py-2 px-4 rounded-full hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200">
        <ShieldCheck className="mr-2 h-4 w-4" /> Verify Deal
      </Link>
      <div className="rounded-md border m-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Unique Key</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Deal Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Redeemed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: any) => (
              <TableRow key={item._id}>
                <TableCell className="font-mono font-bold text-blue-600">
                  {item.uniqueKey}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.user?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.user?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.deal?.title}</TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(item.status)} capitalize`}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default RedemtionTable;
