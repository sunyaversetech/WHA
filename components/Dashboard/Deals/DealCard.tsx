"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DealsGetValues, useDeleteDeal } from "@/services/deal.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";

export function DealsTable({ data }: { data?: DealsGetValues[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: deleteDeal } = useDeleteDeal();
  console.log(data);

  const handleDelete = (id: string) => {
    deleteDeal(
      { id: id },
      {
        onSuccess: () => {
          toast.success("Deal deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["deals"] });
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to delete deal");
        },
      },
    );
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Verified Redemptions</TableHead>
            <TableHead>Current Redemptions</TableHead>
            <TableHead>Max Redemptions</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((deal) => {
            const expiryDate = new Date(deal.valid_till).toLocaleDateString();
            const isExpired = new Date(deal.valid_till) < new Date();
            return (
              <TableRow key={deal._id}>
                <TableCell className="font-medium">{deal.title}</TableCell>
                <TableCell>{deal.verifiedRedemptions}</TableCell>
                <TableCell>{deal.current_redemptions}</TableCell>
                <TableCell>{deal.max_redemptions}</TableCell>
                <TableCell>{expiryDate}</TableCell>
                <TableCell>
                  <Badge variant={isExpired ? "destructive" : "outline"}>
                    {isExpired ? "Expired" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Edit
                      size={15}
                      onClick={() =>
                        router.push(`/dashboard/deals/edit?id=${deal._id}`)
                      }
                    />
                    <DeleteConfirmDialog
                      onConfirm={() => handleDelete(deal._id)}
                      text={deal.title}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
