"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  CirclePlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IEmployee } from "./Form/schema";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import {
  useDeleteEmployees,
  useGetEmployees,
} from "@/services/employee.service";
import AssignEmployee from "./Form/AssignEmployee";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { DynamicBreadcrumb } from "@/components/ui/DynamicBreadCrumb";

interface EmployeeTableProps {
  initialEmployees: IEmployee[];
}

export function EmployeeTable({ initialEmployees }: EmployeeTableProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<IEmployee[]>(initialEmployees);
  const { data: employeesData, isLoading } = useGetEmployees();
  const { mutate, isPending } = useDeleteEmployees();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Employee deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete employee",
          );
        },
      },
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="flex justify-between mb-4 items-center">
        <DynamicBreadcrumb />
        <Link href="/dashboard/employees/add">
          <Button className="w-full md:w-auto">
            <CirclePlus className="mr-2 w-4 h-4" /> Add Employee
          </Button>
        </Link>
      </div>
      <div className="rounded-xl border bg-background shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Employee Profile</TableHead>
              <TableHead>Contact Detail Frame</TableHead>
              <TableHead>Active Status</TableHead>
              <TableHead>Service Sync Count</TableHead>
              <TableHead className="text-right">Management Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employeesData?.data || employeesData.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground">
                  No active employee directory records discovered.
                </TableCell>
              </TableRow>
            ) : (
              employeesData?.data?.map((employee) => (
                <TableRow
                  key={employee._id}
                  className="hover:bg-muted/20 transition-colors">
                  {/* Photo & Name Integration Column */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border shadow-xs">
                        <AvatarImage
                          src={employee.employee_photo}
                          alt={employee.full_name}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                          {employee.full_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight text-foreground">
                          {employee.full_name}
                        </span>
                        {employee.bio && (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[220px]">
                            {employee.bio}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {employee.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {employee.email}
                        </div>
                      )}
                      {employee.phone_number && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {employee.phone_number}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {employee.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none gap-1 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none gap-1 py-0.5">
                        <XCircle className="h-3 w-3" /> Paused
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {employee.service_overrides?.length || 0} Override(s)
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/5"
                        onClick={() =>
                          router.push(
                            `/dashboard/employees/edit/${employee._id}`,
                          )
                        }>
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <DeleteConfirmDialog
                        onConfirm={() => handleDelete(employee._id)}
                        text={employee.full_name}
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
