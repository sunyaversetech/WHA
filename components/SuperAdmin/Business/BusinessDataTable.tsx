"use client";

import React from "react";
import {
  Trash2,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  BanknoteArrowUp,
  BanknoteArrowDown,
} from "lucide-react";
import { UserBusinessType } from "@/services/business.service";
import {
  useBlockBusinessOrUser,
  useDeleteBusinessOrUser,
  useSponsorBusiness,
  useVerifyBusiness,
} from "@/services/super-admin.service";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";

const BusinessTable = ({ data }: { data: UserBusinessType[] }) => {
  const queryClient = useQueryClient();
  const { mutate: blockBusiness } = useBlockBusinessOrUser();
  const { mutate: verifyBusiness } = useVerifyBusiness();
  const { mutate: isSponsor } = useSponsorBusiness();
  const { mutate: deleteBusiness, isPending: deleteisPending } =
    useDeleteBusinessOrUser();

  const handleVerify = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "true";
    verifyBusiness(
      { id, verified: newStatus },
      {
        onSuccess: () => {
          toast.success("Verification status updated");
          queryClient.invalidateQueries({
            queryKey: ["getsuperadminbusinesses"],
          });
        },
        onError: () => toast.error("Failed to update verification"),
      },
    );
  };

  const handleBlock = (id: string, currentStatus: boolean) => {
    blockBusiness(
      { id, isblocked: !currentStatus },
      {
        onSuccess: () => {
          toast.success(
            currentStatus ? "Business unblocked" : "Business blocked",
          );
          queryClient.invalidateQueries({
            queryKey: ["getsuperadminbusinesses"],
          });
        },
        onError: () => toast.error("Action failed"),
      },
    );
  };
  const handleisSponsor = (id: string, currentStatus: boolean) => {
    console.log(id, currentStatus);
    isSponsor(
      { id, sponser: !currentStatus },
      {
        onSuccess: () => {
          toast.success(
            currentStatus
              ? "Business is Sponsored"
              : "Business is not Sponsored",
          );
          queryClient.invalidateQueries({
            queryKey: ["getsuperadminbusinesses"],
          });
        },
        onError: () => toast.error("Action failed"),
      },
    );
  };

  const handleDelete = async (id: string) => {
    deleteBusiness(
      { id },
      {
        onSuccess: () => {
          toast.success("Business deleted successfully");
          queryClient.invalidateQueries({
            queryKey: ["getsuperadminbusinesses"],
          });
        },
        onError: () => toast.error("Failed to delete business"),
      },
    );
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">Business</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Verify Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item._id}
              className={item.isblocked ? "bg-destructive/5 opacity-80" : ""}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage
                      src={item.image}
                      alt={item.business_name}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {item.business_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold leading-none">
                      {item.business_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 capitalize">
                      {item.category}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="font-medium text-muted-foreground">
                {item.name}
              </TableCell>

              <TableCell>
                <Select
                  defaultValue={item.verified.toString()}
                  onValueChange={(val) => handleVerify(item._id ?? "", val)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Verified
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        Pending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={`h-8 gap-1`}
                    onClick={() =>
                      handleisSponsor(item._id ?? "", item.isSponsor)
                    }>
                    {item.isSponsor ? (
                      <>
                        <BanknoteArrowDown className="h-3.5 w-3.5 text-red-500" />
                        Remove Sponsor
                      </>
                    ) : (
                      <>
                        <BanknoteArrowUp className="h-3.5 w-3.5 text-green-500" />
                        Sponsor
                      </>
                    )}
                  </Button>
                  <Button
                    variant={item.isblocked ? "outline" : "default"}
                    size="sm"
                    className={`h-8 gap-1 `}
                    onClick={() => handleBlock(item._id ?? "", item.isblocked)}>
                    {item.isblocked ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        Block
                      </>
                    )}
                  </Button>

                  <DeleteConfirmDialog
                    onConfirm={() => handleDelete(item._id ?? "")}
                    text={item.business_name ?? ""}
                    isPending={deleteisPending}
                    header={
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5" />{" "}
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BusinessTable;
