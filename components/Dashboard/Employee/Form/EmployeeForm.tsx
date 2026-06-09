"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmployeeFormValues, employeeSchema, IEmployee } from "./schema";
import { useCreateOrUpdateEmployee } from "@/services/employee.service";

interface EmployeeFormProps {
  initialData?: IEmployee | null;
  businessId: string; // Passed from server session
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function EmployeeForm({ initialData, businessId }: EmployeeFormProps) {
  const router = useRouter();
  const { mutate, isPending } = useCreateOrUpdateEmployee();
  const [previewUrl, setPreviewUrl] = useState(
    initialData?.employee_photo || "",
  );
  const isEditMode = !!initialData;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData
      ? {
          full_name: initialData.full_name,
          email: initialData.email || "",
          phone_number: initialData.phone_number || "",
          bio: initialData.bio || "",
          employee_photo: initialData.employee_photo || "",
          is_active: initialData.is_active,
          availability_schedule: initialData.availability_schedule || [],
          service_overrides: initialData.service_overrides || [],
        }
      : {
          full_name: "",
          email: "",
          phone_number: "",
          bio: "",
          employee_photo: "",
          is_active: true,
          availability_schedule: DAYS_OF_WEEK.map((day) => ({
            day_of_week: day as any,
            is_working: true,
            shift_start: "09:00",
            shift_end: "17:00",
          })),
          service_overrides: [],
        },
  });

  const { fields: availabilityFields } = useFieldArray({
    control: form.control,
    name: "availability_schedule",
  });

  async function onSubmit(data: EmployeeFormValues) {
    const formData = new FormData();

    formData.append("full_name", data.full_name);
    formData.append("email", data.email || "");
    formData.append("phone_number", data.phone_number || "");
    formData.append("bio", data.bio || "");
    formData.append("is_active", String(data.is_active));

    formData.append(
      "availability_schedule",
      JSON.stringify(data.availability_schedule),
    );
    formData.append(
      "service_overrides",
      JSON.stringify(data.service_overrides),
    );

    if (data.employee_photo instanceof File) {
      formData.append("employee_photo", data.employee_photo);
    }

    mutate(formData as any, {
      onSuccess: () => {
        router.push("/dashboard/employee");
      },
      onError: (err) => {
        console.error("Mutation error:", err);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8  p-6  rounded-xl shadow-sm">
        {/* Photo URL & Profile Header Row */}
        <div className="flex flex-col sm:flex-row gap-6 items-center border-b pb-6">
          <Avatar className="h-24 w-24 border-2 border-muted">
            <AvatarImage src={previewUrl} alt="Preview" />
            <AvatarFallback className="bg-gray-300">
              <User className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 w-full space-y-2">
            <FormField
              control={form.control}
              name="employee_photo"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Employee Photo</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Set the raw file object into React Hook Form
                            onChange(file);
                            // Create a temporary URL for the <Avatar /> preview
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        {...fieldProps}
                      />
                      {value instanceof File && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onChange(initialData?.employee_photo || "");
                            setPreviewUrl(initialData?.employee_photo || "");
                          }}>
                          Reset to original
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Primary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="jane.doe@business.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6 shadow-xs">
                <div className="space-y-0.5">
                  <FormLabel>Active Employment Status</FormLabel>
                  <FormDescription>
                    Toggle off to halt booking intake assignments.
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

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography / Professional Focus</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Specializes in skincare and therapeutic massage..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <hr />

        {/* Weekly Availability Setup Scheduler Row */}
        <div>
          <h3 className="text-lg font-medium tracking-tight mb-3">
            Weekly Operating Availability Schedule
          </h3>
          <div className="space-y-3">
            {availabilityFields.map((field, index) => {
              const isWorking = form.watch(
                `availability_schedule.${index}.is_working`,
              );
              return (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 border rounded-lg bg-muted/30">
                  <span className="capitalize font-semibold min-w-[100px]">
                    {form.getValues(
                      `availability_schedule.${index}.day_of_week`,
                    )}
                  </span>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <FormField
                      control={form.control}
                      name={`availability_schedule.${index}.is_working`}
                      render={({ field: wField }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={wField.value}
                              onCheckedChange={wField.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-xs font-normal">
                            Working
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`availability_schedule.${index}.shift_start`}
                        render={({ field: sField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="w-24 h-8 text-center text-xs"
                                type="text"
                                placeholder="09:00"
                                disabled={!isWorking}
                                {...sField}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <FormField
                        control={form.control}
                        name={`availability_schedule.${index}.shift_end`}
                        render={({ field: eField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="w-24 h-8 text-center text-xs"
                                type="text"
                                placeholder="17:00"
                                disabled={!isWorking}
                                {...eField}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Save Changes" : "Register Employee"}
        </Button>
      </form>
    </Form>
  );
}
