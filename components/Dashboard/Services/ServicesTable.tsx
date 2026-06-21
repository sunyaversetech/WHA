"use client";

import { useRouter } from "next/navigation";
import { Edit2, Trash2, CheckCircle2, XCircle, CirclePlus } from "lucide-react";

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
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { useGetServices } from "@/services/booking.service";
import { useDeleteServices } from "@/services/services.service";
import { useQueryClient } from "@tanstack/react-query";
import AssignEmployee from "../Employee/Form/AssignEmployee";
import { DynamicBreadcrumb } from "@/components/ui/DynamicBreadCrumb";
import Link from "next/link";
import { useSession } from "next-auth/react";
import BusinessType from "../Settings/BusinessType";

export function ServicesTable() {
  const router = useRouter();
  const { data } = useGetServices();
  const { mutate } = useDeleteServices();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const handleDelete = async (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Service deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["getservices"] });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete service",
          );
        },
      },
    );
  };

  if (!session?.user?.business_type) {
    return (
      <>
        <BusinessType />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between mb-4 items-center">
        <DynamicBreadcrumb />
        <Link href={"/dashboard/services/add"}>
          <Button>
            <CirclePlus className="mr-2 h-4 w-4" /> Add Services
          </Button>
        </Link>
      </div>
      <div className="rounded-md border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration & Buffer</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  No services configuration entries discovered.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((service) => (
                <TableRow key={service._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{service.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {service.base_duration}m
                    </span>
                    {service.buffer_time && service.buffer_time > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (+{service.buffer_time}m buff)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${service.base_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {service.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none gap-1">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex gap-5 justify-end">
                    <AssignEmployee serviceId={service._id} />

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-blue-500"
                        onClick={() =>
                          router.push(`/dashboard/services/edit/${service._id}`)
                        }>
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <DeleteConfirmDialog
                        onConfirm={() => handleDelete(service._id)}
                        text={service.name}
                        header={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
