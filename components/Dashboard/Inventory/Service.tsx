"use client";

import React, { useState } from "react";
import {
  Plus,
  FolderPlus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import * as z from "zod";

export const serviceSchema = z.object({
  id: z.string().optional(),
  service_name: z.string().min(2, "Required"),
  assigned_to: z.string().min(2, "Required"),
  price: z.number().min(0),
  pricing_category: z.enum(["hour", "day", "month"]),
  day_from: z.string(),
  day_to: z.string(),
  time_from: z.string(),
  time_to: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;

export interface Category {
  id: string;
  name: string;
  services: Service[];
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIMES = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function CategorizedServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newCatName, setNewCatName] = useState("");

  const form = useForm<Service>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      pricing_category: "hour",
      day_from: "Monday",
      day_to: "Friday",
      time_from: "9:00 AM",
      time_to: "5:00 PM",
    },
  });

  const addCategory = () => {
    if (!newCatName) return;
    setCategories([
      ...categories,
      { id: Date.now().toString(), name: newCatName, services: [] },
    ]);
    setNewCatName("");
    setIsCatDialogOpen(false);
  };

  const handleServiceSubmit = (values: Service) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === activeCategoryId) {
          if (editingService) {
            return {
              ...cat,
              services: cat.services.map((s) =>
                s.id === editingService.id ? { ...values, id: s.id } : s,
              ),
            };
          }
          return {
            ...cat,
            services: [
              ...cat.services,
              { ...values, id: Date.now().toString() },
            ],
          };
        }
        return cat;
      }),
    );
    setIsServiceDialogOpen(false);
    setEditingService(null);
  };

  const onSubmit = (values: Service) => {
    console.log(values);
  };

  return (
    <div className="p-8 max-w-8xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Service Management
          </h1>
          <p className="text-muted-foreground">
            Organize your services by category
          </p>
        </div>
        <Button
          onClick={() => setIsCatDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700">
          <FolderPlus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-slate-400">
            No categories added yet. Start by creating a category.
          </p>
        </div>
      )}

      {categories.map((category) => (
        <Card key={category.id} className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-500 rounded-full" />
              {category.name}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveCategoryId(category.id);
                setEditingService(null);
                setIsServiceDialogOpen(true);
              }}>
              <Plus className="mr-2 h-4 w-4" /> Add Service to {category.name}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Service Name</TableHead>
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
                      className="text-center py-6 text-slate-400 text-xs italic">
                      No services in this category
                    </TableCell>
                  </TableRow>
                ) : (
                  category.services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="pl-6 font-medium">
                        {service.service_name}
                      </TableCell>
                      <TableCell>{service.assigned_to}</TableCell>
                      <TableCell>
                        ${service.price}/{service.pricing_category}
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] leading-tight">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {service.day_from}-
                            {service.day_to}
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-3 w-3" /> {service.time_from}-
                            {service.time_to}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveCategoryId(category.id);
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
      ))}

      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <FormLabel>Category Name</FormLabel>
                  <Input
                    placeholder="e.g. Plumbing, Electrical..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>
                <Button onClick={addCategory} className="w-full bg-orange-600">
                  Create Category
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit" : "Add"} Service</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleServiceSubmit)}
              className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricing_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="day">Per Day</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
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
                      <FormLabel>Day From</FormLabel>
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
                      <FormLabel>Day To</FormLabel>
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
              <div className="grid grid-cols-2 gap-4  pt-4">
                <FormField
                  control={form.control}
                  name="time_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time From</FormLabel>
                      <Input
                        type="time"
                        defaultValue="18:30:00"
                        className="bg-background appearance-none "
                        {...field}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time To</FormLabel>
                      <Input
                        type="time"
                        defaultValue="18:30:00"
                        className="bg-background appearance-none "
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
              {/* Note: Repeat Select structure for Time and Price... */}
              <Button type="submit" className="w-full bg-orange-600">
                Save Service
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
