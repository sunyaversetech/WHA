"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

import * as z from "zod";

const resourceSchema = z.object({
  name: z.string().min(2, "Resource name required"),
  price: z.number().min(0),
  type: z.string().min(2),
  available_slots: z.array(
    z.object({
      day: z.string(),
      from: z.string(),
      to: z.string(),
    }),
  ),
});

const serviceSchema = z.object({
  name: z.string().min(2, "Service name required"),
  item_description: z.string().optional(),
  price_category: z.enum(["hr", "day", "monthly", "unit"]),
  resources: z.array(resourceSchema),
});

export const profileSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    country_code: z.string().min(1),
    phone_number: z.string().min(7, "Invalid phone number"),
    user_name: z.string().min(2, "User name required"),
  }),
  z.object({
    role: z.literal("business"),
    business_name: z.string().min(2, "Business name required"),
    business_category: z.string().min(2),
    service_category: z.string().min(2),
    location: z.string().min(5, "Address required"),
    business_service: z.array(serviceSchema),
  }),
]);

export type ProfileFormValues = z.infer<typeof profileSchema>;

function ResourceSection({
  nestIndex,
  control,
}: {
  nestIndex: number;
  control: any;
  form: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `business_service.${nestIndex}.resources`,
  });

  return (
    <div className="ml-6 mt-4 space-y-4 border-l-2 pl-4 border-slate-200">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-600">
          Resources (Staff/Tools)
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ name: "", price: 0, type: "Staff", available_slots: [] })
          }>
          <Plus className="w-3 h-3 mr-1" /> Add Resource
        </Button>
      </div>

      {fields.map((item, k) => (
        <Card key={item.id} className="p-4 bg-white shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={control}
              name={`business_service.${nestIndex}.resources.${k}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Resource Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`business_service.${nestIndex}.resources.${k}.price`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`business_service.${nestIndex}.resources.${k}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Technician" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-destructive"
            onClick={() => remove(k)}>
            Remove Resource
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default function CompleteProfilePage() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: "user",
      country_code: "+1",
      phone_number: "",
    },
  });

  const role = form.watch("role");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: role === "business" ? "business_service" : ("" as any),
  });

  async function onSubmit(data: ProfileFormValues) {
    const response = await fetch("/api/business/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.ok) alert("Profile Saved!");
  }

  return (
    <div className="container max-w-2xl m-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ROLE SELECTION */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Individual User</SelectItem>
                        <SelectItem value="business">
                          Business Entity
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === "user" && (
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+61">au +61</SelectItem>
                            <SelectItem value="+977">🇳🇵 +977</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user_name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="98XXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {role === "business" && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your Business Name..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="business_category"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Business Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white w-full">
                              <SelectValue placeholder="Choose your business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="restaurants">
                              Restaurants
                            </SelectItem>
                            <SelectItem value="cafes">Cafés</SelectItem>
                            <SelectItem value="food_trucks">
                              Food Trucks
                            </SelectItem>
                            <SelectItem value="grocery">Grocery</SelectItem>
                            <SelectItem value="salons">Salons</SelectItem>
                            <SelectItem value="consultancies">
                              Consultancies
                            </SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_category"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Service Category</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Services Offered</h3>
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          name: "",
                          item_description: "",
                          price_category: "hr",
                          resources: [],
                        })
                      }>
                      <Plus className="w-4 h-4 mr-2" /> Add New Service
                    </Button>
                  </div>

                  {fields.map((field, index = 1) => (
                    <div
                      key={field.id}
                      className="relative p-6 border rounded-xl bg-slate-50/50 space-y-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`business_service.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Plumbing" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`business_service.${index}.price_category`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hr">Per Hour</SelectItem>
                                  <SelectItem value="day">Per Day</SelectItem>
                                  <SelectItem value="monthly">
                                    Monthly
                                  </SelectItem>
                                  <SelectItem value="unit">Per Unit</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`business_service.${index}.item_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <textarea
                                className="w-full p-2 border rounded-md text-sm"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <ResourceSection
                        nestIndex={index}
                        control={form.control}
                        form={form}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full">
                Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
