"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useCreateEvent } from "@/services/event.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MapPicker from "./LeafLetIntegration";

const toggleItemStyles =
  "border! rounded-lg! px-7! py-2! data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground! flex-1";

export const eventSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  image: z.any().refine((file) => file instanceof File, "Image is required"),
  venue: z.string().min(2, "Venue is required"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  category: z.string().min(1, "Category is required"),
  price_category: z.enum(["free", "paid"]),
  ticket_link: z.string().optional(),
  ticket_price: z.string().optional(),
  community: z.string().min(1, "Community is required"),
  city: z.string().min(2, "City is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  latitude: z.number(),
  longitude: z.number(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export function EventForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      venue: "",
      startTime: "",
      endTime: "",
      community: "",
      city: "",
      description: "",
      location: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const onSubmit = (values: EventFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "dateRange") {
        formData.append("startDate", (value as any).from.toISOString());
        formData.append("endDate", (value as any).to.toISOString());
      } else {
        formData.append(key, value as any);
      }
    });

    mutate(formData as any, {
      onSuccess: () => {
        toast.success("Event created successfully!");
        queryClient.invalidateQueries({ queryKey: ["event"] });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create event");
      },
    });
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Event Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. Image */}
        <FormField
          control={form.control}
          name="image"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Event Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files?.[0])}
                  {...fieldProps}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3. Venue */}
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Grand Ballroom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 4. Date Range */}
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>From and to Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border rounded-lg">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.from ? (
                      field.value.to ? (
                        `${format(field.value.from, "PP")} - ${format(field.value.to, "PP")}`
                      ) : (
                        format(field.value.from, "PP")
                      )
                    ) : (
                      <span>Pick Dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        {/* 5 & 6. Time From/To */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time From</FormLabel>
                <FormControl>
                  <Input type="time" className="rounded-lg" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time To</FormLabel>
                <FormControl>
                  <Input type="time" className="rounded-lg" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(val) => val && field.onChange(val)}
                  className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    "Community",
                    "Festival",
                    "Cultural Event",
                    "Event",
                    "Others",
                  ].map((cat) => (
                    <ToggleGroupItem
                      key={cat}
                      value={cat}
                      className={toggleItemStyles}>
                      {cat}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price Category</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(val) => val && field.onChange(val)}
                  className="flex gap-2">
                  <ToggleGroupItem value="free" className={toggleItemStyles}>
                    Free
                  </ToggleGroupItem>
                  <ToggleGroupItem value="paid" className={toggleItemStyles}>
                    Paid
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("price_category") === "paid" && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
            <FormField
              name="ticket_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="ticket_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Link</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="community"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(val) => val && field.onChange(val)}
                  className="grid grid-cols-3 gap-2">
                  {[
                    "Australian",
                    "Nepali",
                    "Indian",
                    "Bhutanese",
                    "European",
                    "Others",
                  ].map((com) => (
                    <ToggleGroupItem
                      key={com}
                      value={com}
                      className={toggleItemStyles}>
                      {com}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(val) => val && field.onChange(val)}
                  className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    "Sydney",
                    "Canberra",
                    "Melbourne",
                    "Brisbane",
                    "Adelaide",
                    "Gold Coast",
                    "Perth",
                    "Hobart",
                    "Darwin",
                    "others",
                  ].map((cat) => (
                    <ToggleGroupItem
                      key={cat}
                      value={cat}
                      className={toggleItemStyles}>
                      {cat}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea className="rounded-lg" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <MapPicker form={form} />

        <Button
          type="submit"
          className="w-full h-12 text-lg rounded-lg"
          disabled={isPending}>
          {isPending ? "Creating Event..." : "Create Event"}
        </Button>
      </form>
    </Form>
  );
}
