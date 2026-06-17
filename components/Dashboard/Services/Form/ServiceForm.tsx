"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { serviceSchema, ServiceFormValues, IService } from "./schema";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateOrUpdateService } from "@/services/services.service";
import { DynamicBreadcrumb } from "@/components/ui/DynamicBreadCrumb";
import { useGetEmployees } from "@/services/employee.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ServiceFormProps {
  initialData?: IService | null;
}

export function ServiceForm({ initialData }: ServiceFormProps) {
  const router = useRouter();
  const { mutate, isPending } = useCreateOrUpdateService();
  const { data: employee } = useGetEmployees();

  const isEditMode = !!initialData;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData
      ? {
          _id: initialData._id,
          name: initialData.name,
          description: initialData.description,
          category: initialData.category,
          base_price: initialData.base_price,
          base_duration: initialData.base_duration,
          buffer_time: initialData.buffer_time || 0,
          require_employee_selection:
            initialData.require_employee_selection || false,
          is_active:
            initialData.is_active !== undefined ? initialData.is_active : true,
          business_type: initialData.business_type || "employee_based",
          inventory: initialData.inventory,
          assigned_employees:
            typeof initialData?.assigned_employees === "object"
              ? initialData?.assigned_employees?.map((e: any) => e._id)
              : [],
        }
      : {
          name: "",
          description: "",
          category: "",
          base_price: 0,
          base_duration: 0,
          buffer_time: 0,
          require_employee_selection: false,
          is_active: true,
          business_type: "employee_based",
          inventory: 0,
          assigned_employees: [],
        },
  });

  const currentBusinessType = form.watch("business_type");

  async function onSubmit(data: ServiceFormValues) {
    const finalData = { ...data };

    if (finalData.business_type === "employee_based") {
      finalData.inventory = 0;
    } else {
      finalData.assigned_employees = [];
      finalData.require_employee_selection = false;
    }

    mutate(finalData, {
      onSuccess: () => {
        toast.success("Service saved successfully");
        router.push(`/dashboard/services`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to save service");
      },
    });
  }

  return (
    <>
      <DynamicBreadcrumb />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Deep Tissue Massage or Kayak Rental"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Rentals or Spa Treatment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide details about the service highlights..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (AUD$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (mins)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buffer_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer Time (mins)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <hr className="my-4" />

          {/* Business Model Select Dropdown */}
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Operational Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select how this service is fulfilled" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee_based">
                        Staff / Employee Based (e.g., Haircut, Massage,
                        Consulting)
                      </SelectItem>
                      <SelectItem value="item_based">
                        Item / Inventory Based (e.g., Kayak, Boat, Surfboard
                        rentals)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determines whether customers reserve human staff time or
                    physical stock assets.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* CONDITIONAL RENDERING: STAFF SELECTION (for employee_based) */}
            {currentBusinessType === "employee_based" && (
              <FormField
                control={form.control}
                name="assigned_employees"
                render={({ field }) => {
                  const selectedValues = Array.isArray(field.value)
                    ? field.value
                    : [];

                  const handleSelect = (employeeId: string) => {
                    const updatedValues = selectedValues.includes(employeeId)
                      ? selectedValues.filter((id) => id !== employeeId)
                      : [...selectedValues, employeeId];

                    field.onChange(updatedValues);
                  };

                  return (
                    <FormItem className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm animate-in fade-in duration-200">
                      <FormLabel>Select Staff (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full rounded-md! border-gray-300! justify-between h-auto min-h-10 px-3 py-2 text-left font-normal",
                                selectedValues.length === 0 &&
                                  "text-muted-foreground",
                              )}>
                              {selectedValues.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[95%]">
                                  {employee?.data
                                    ?.filter((emp) =>
                                      selectedValues.includes(emp._id),
                                    )
                                    ?.map((emp) => (
                                      <Badge
                                        variant="secondary"
                                        key={emp._id}
                                        className="flex items-center gap-1 pr-1 text-white">
                                        {emp.email}
                                        <button
                                          type="button"
                                          className="rounded border-none! outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                          onClick={() => handleSelect(emp._id)}>
                                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                      </Badge>
                                    ))}
                                </div>
                              ) : (
                                "Select Staff"
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 self-center" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start">
                          <Command>
                            <CommandInput placeholder="Search staff..." />
                            <CommandList>
                              {!employee?.data || employee.data.length === 0 ? (
                                <CommandEmpty className="flex flex-col items-center justify-center gap-3 p-6 text-center text-sm">
                                  <span className="text-muted-foreground">
                                    No employees found in your system.
                                  </span>
                                  <Link
                                    href="/dashboard/employee/add"
                                    className={cn(
                                      buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                      }),
                                      "gap-1.5",
                                    )}>
                                    <Plus className="h-3.5 w-3.5" /> Add New
                                    Employee
                                  </Link>
                                </CommandEmpty>
                              ) : (
                                <>
                                  <CommandEmpty>
                                    No staff matches your search.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {employee.data.map((emp) => {
                                      const isSelected =
                                        selectedValues.includes(emp._id);
                                      return (
                                        <CommandItem
                                          key={emp._id}
                                          value={emp.email}
                                          onSelect={() =>
                                            handleSelect(emp._id)
                                          }>
                                          <div
                                            className={cn(
                                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                              isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible",
                                            )}>
                                            <Check className="h-4 w-4" />
                                          </div>
                                          <span>{emp.email}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  );
                }}
              />
            )}

            {currentBusinessType === "item_based" && (
              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm animate-in fade-in duration-200">
                    <FormLabel>Total Available Items (Stock)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="E.g., 15 (Total Kayaks available for booking)"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The total amount of items you own that can be rented out
                      simultaneously.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Toggle visibility on your public booking page.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Service"}
          </Button>
        </form>
      </Form>
    </>
  );
}
