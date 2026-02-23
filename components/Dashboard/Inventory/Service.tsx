"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FolderPlus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; // Or your preferred toast library

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

import * as z from "zod";
import CreateCategoryDialog from "./CreateCategoryDialog";
import { useCreateService, useGetActivity } from "@/services/inventory.service";
import { useQueryClient } from "@tanstack/react-query";

export const serviceSchema = z.object({
  id: z.string().optional(),
  activeCategoryType: z.string().optional(),
  service_name: z.string().min(2, "Required"),
  assigned_to: z.string().min(2, "Required"),
  price: z.number().min(0),
  pricing_category: z.enum(["hour", "day", "month"]),
  day_from: z.string(),
  day_to: z.string(),
  time_from: z.string(),
  time_to: z.string(),
});

export type ServicePostTypeSchema = z.infer<typeof serviceSchema>;

export interface Category {
  _id: string;
  name: string;
  services: ServicePostTypeSchema[];
}

export default function CategorizedServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingService, setEditingService] =
    useState<ServicePostTypeSchema | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ServicePostTypeSchema>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      pricing_category: "hour",
      day_from: "Monday",
      day_to: "Friday",
      time_from: "09:00",
      time_to: "17:00",
    },
  });

  const { data, isLoading } = useGetActivity();

  useEffect(() => {
    setTimeout(() => setCategories(data?.data ?? []), 0);
  }, [data]);

  const { mutate } = useCreateService(activeCategoryId ?? "");
  const handleServiceSubmit = async (values: ServicePostTypeSchema) => {
    mutate(values, {
      onSuccess: (res) => {
        toast.success(editingService ? "Service updated" : "Service added");
        setIsServiceDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["category"],
        });
        setEditingService(null);
        form.reset({
          pricing_category: "hour",
          day_from: "Monday",
          day_to: "Friday",
          time_from: "09:00",
          time_to: "17:00",
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Submission failed");
      },
    });
    // try {
    //   const url = editingService
    //     ? `/api/inventory/${activeCategoryId}/${editingService.id}`
    //     : `/api/inventory/${activeCategoryId}`;

    //   const res = await fetch(url, {
    //     method: editingService ? "PUT" : "POST",
    //     body: JSON.stringify(values),
    //   });

    //   if (!res.ok) throw await res.json();

    //   toast.success(editingService ? "Service updated" : "Service added");
    //   setIsServiceDialogOpen(false);
    //   setEditingService(null);
    //   form.reset();
    // } catch (error: any) {
    //   toast.error(error.message || "Submission failed");
    // }
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );

  return (
    <div className="p-8 max-w-8xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Service Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Organize your offerings by category
          </p>
        </div>
        <Button
          onClick={() => setIsCatDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 shadow-md">
          <FolderPlus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-slate-50/50">
          <p className="text-slate-400">
            No categories added yet. Start by creating a category.
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <Card
            key={category._id}
            className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b py-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                {category.name}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => {
                  setActiveCategoryId(category._id);
                  setEditingService(null);
                  form.reset({
                    pricing_category: "hour",
                    day_from: "Monday",
                    day_to: "Friday",
                    time_from: "09:00",
                    time_to: "17:00",
                  });
                  setIsServiceDialogOpen(true);
                }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Service
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 w-[250px]">
                      Service Name
                    </TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.services.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-slate-400 text-xs italic">
                        No services registered in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    category.services.map((service) => (
                      <TableRow key={service.id} className="group">
                        <TableCell className="pl-6 font-medium text-slate-700">
                          {service.service_name}
                        </TableCell>
                        <TableCell>{service.assigned_to}</TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          ${service.price}{" "}
                          <span className="text-[10px] text-slate-400 font-normal uppercase">
                            / {service.pricing_category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                              <Calendar className="h-3 w-3 text-orange-500" />{" "}
                              {service.day_from} - {service.day_to}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Clock className="h-3 w-3" /> {service.time_from}{" "}
                              - {service.time_to}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setActiveCategoryId(category._id);
                              setEditingService(service);
                              form.reset(service);
                              setIsServiceDialogOpen(true);
                            }}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <CreateCategoryDialog
        isOpen={isCatDialogOpen}
        onOpenChange={setIsCatDialogOpen}
      />

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Update" : "Add New"} Service
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleServiceSubmit)}
              className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Repairing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Assigned</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricing_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hour">Hourly</SelectItem>
                          <SelectItem value="day">Daily</SelectItem>
                          <SelectItem value="month">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="day_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="day_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="time_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 h-11">
                {editingService
                  ? "Update Service Information"
                  : "Add Service to Category"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
