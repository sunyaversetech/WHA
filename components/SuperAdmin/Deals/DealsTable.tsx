"use client";

import React from "react";
import { Trash2, Tag, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Shadcn Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSuperAdminDeleteDeal } from "@/services/super-admin.service";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { DealsGetValues } from "@/services/deal.service";

const DealsTable = ({ data }: { data: DealsGetValues[] }) => {
  const { mutate } = useSuperAdminDeleteDeal();
  const queryClient = useQueryClient();
  const handleDeleteDeal = async (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      toast.success("Deal removed successfully");
    }

    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Deal removed successfully");
          queryClient.invalidateQueries({ queryKey: ["getSuperAdminDeals"] });
        },
        onError: () => {
          toast.error("Failed to remove deal");
        },
      },
    );
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Deal Title</TableHead>
            <TableHead className="w-[200px]">Deal Details</TableHead>
            <TableHead>Validity</TableHead>
            <TableHead>Redemption Progress</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((deal) => {
            const redemptionRate =
              (deal.current_redemptions / deal.max_redemptions) * 100;

            return (
              <TableRow
                key={deal._id}
                className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <span className="font-bold text-primary">{deal.title}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {deal.description}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {deal.valid_till
                      ? format(new Date(deal.valid_till), "MMM dd, yyyy")
                      : "N/A"}
                  </div>
                </TableCell>

                <TableCell className="w-[200px]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span>{deal.current_redemptions} used</span>
                      <span>{deal.max_redemptions} limit</span>
                    </div>
                    <Progress value={redemptionRate} className="h-1.5" />
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    <Users size={10} className="mr-1" />
                    {deal.deals_for}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DeleteConfirmDialog
                    text={deal.title}
                    onConfirm={() => {
                      handleDeleteDeal(deal._id);
                    }}
                    header={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default DealsTable;
