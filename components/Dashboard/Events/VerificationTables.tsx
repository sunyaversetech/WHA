"use client";

import { useParams } from "next/navigation";
import { useGetEventVerifyUsers } from "@/services/event.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const VerificationTables = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isLoading } = useGetEventVerifyUsers(id);

  const rawData: any = data?.data || [];

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.text("Verified Coupons Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Verified: ${rawData.length}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["User Name", "Unique Key", "Verified Date"]],
      body: rawData.map((item: any) => [
        item.user?.name || "N/A",
        item.uniqueKey,
        new Date(item.verifiedAt).toLocaleString(),
      ]),
    });

    doc.save("verified-coupons.pdf");
  };

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Card className="w-[250px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Verified Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rawData.length}</div>
          </CardContent>
        </Card>

        <Button onClick={exportToPDF} className="flex gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Shadcn Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Unique Key</TableHead>
              <TableHead className="text-right">Verified Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rawData.length > 0 ? (
              rawData.map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    {item.user?.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.uniqueKey}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(item.verifiedAt).toLocaleDateString()}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(item.verifiedAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No verified users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VerificationTables;
