"use client";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  useGetOperatingHours,
  useUpdateOperatingHours,
} from "@/services/business.service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect } from "react";
import Loading from "@/app/businesses/loading";

const operatinghoursformSchema = z.object({
  business_id: z.string().optional(),
  is24_7: z.boolean(),
  schedule: z.array(
    z.object({
      day: z.string(),
      isOpen: z.boolean(),
      openTime: z.string(),
      closeTime: z.string(),
    }),
  ),
});

export type OperatingHourPostType = z.infer<typeof operatinghoursformSchema>;

const DEFAULT_SCHEDULE = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
].map((day) => ({
  day,
  isOpen: true,
  openTime: "06:00", // Use 24h format "06:00" for HTML time inputs
  closeTime: "22:00",
}));

export function BusinessHoursForm() {
  const { data, isLoading } = useGetOperatingHours();

  const form = useForm({
    resolver: zodResolver(operatinghoursformSchema),
    defaultValues: {
      is24_7: false,
      schedule: DEFAULT_SCHEDULE,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  const { mutate } = useUpdateOperatingHours();
  const { data: session } = useSession();

  useEffect(() => {
    if (data?.data && data?.data !== undefined) {
      const mergedSchedule = DEFAULT_SCHEDULE.map((defaultDay) => {
        const existingDay = data.data.schedule?.find(
          (d: any) => d.day === defaultDay.day,
        );
        return existingDay
          ? { ...existingDay, isOpen: true }
          : { ...defaultDay, isOpen: false };
      });

      form.reset({
        is24_7: data.data.is24_7 || false,
        schedule: mergedSchedule,
        business_id: data.data.business_id,
      });
    }
  }, [data, form]);

  async function onSubmit(values: OperatingHourPostType) {
    const filteredSchedule = values.schedule.filter((item) => item.isOpen);
    mutate(
      {
        ...values,
        business_id: String(session?.user?.id ?? ""),
        schedule: filteredSchedule,
      },
      {
        onSuccess: () => {
          toast.success("Operating hours updated successfully");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update hours",
          );
        },
      },
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl p-6">
        <h2 className="text-xl font-bold">Operating Hours</h2>

        <FormField
          control={form.control}
          name="is24_7"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-blue-900">24/7 Operation</FormLabel>
            </FormItem>
          )}
        />

        {!form.watch("is24_7") && (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-8">
                {/* Day Toggle */}
                <FormField
                  control={form.control}
                  name={`schedule.${index}.isOpen`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 w-32">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-medium">
                        {fields[index].day}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Open Time */}
                <FormField
                  control={form.control}
                  name={`schedule.${index}.openTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-gray-500">
                        Open
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={!form.watch(`schedule.${index}.isOpen`)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`schedule.${index}.closeTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-gray-500">
                        Close
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={!form.watch(`schedule.${index}.isOpen`)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            disabled={!form.formState.isDirty}
            type="submit"
            className="bg-blue-950 rounded-md hover:bg-blue-400">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}
