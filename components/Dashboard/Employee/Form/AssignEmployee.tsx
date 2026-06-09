"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus, Search, Check } from "lucide-react";
import { useGetEmployees } from "@/services/employee.service";
import { useAssignEmployees } from "@/services/services.service";
import { toast } from "sonner";

interface AssignEmployeeProps {
  serviceId: string;
  serviceName?: string;
}

const AssignEmployee = ({ serviceId, serviceName }: AssignEmployeeProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: employees, isLoading } = useGetEmployees();
  const { mutate, isPending } = useAssignEmployees();

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees?.data?.filter((emp: any) =>
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [employees, searchQuery]);

  // Toggle selection inside the array
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAssign = () => {
    if (selectedIds.length === 0) return;

    mutate(
      { serviceId, employeeId: selectedIds },
      {
        onSuccess: () => {
          toast.success(
            `${selectedIds.length} staff member(s) assigned successfully`,
          );
          setOpen(false);
          setSelectedIds([]);
          setSearchQuery("");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to assign employees");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Assign Staff
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Employees</DialogTitle>
          <DialogDescription>
            Select all staff members who provide {serviceName || "this service"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[250px] rounded-md border p-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEmployees.length > 0 ? (
              <div className="space-y-1">
                {filteredEmployees.map((emp: any) => {
                  const isSelected = selectedIds.includes(emp._id);
                  return (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => handleToggleSelect(emp._id)}
                      className={`w-full flex items-center justify-between p-2 rounded-sm text-sm transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}>
                      <span>{emp.full_name}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No employees found.
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedIds.length === 0 || isPending}
            className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign (${selectedIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEmployee;
