"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Trash2,
  Plus,
  User as UserIcon,
  Building2,
  CheckCircle2,
  Mail,
  Briefcase,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

const ProfilePage = ({ userData }: { userData: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const form = useForm({
    defaultValues: {
      name: userData?.name || "",
      image: userData?.image || "",
      category: userData?.category || "user",
      business_name: userData?.business_name || "",
      business_category: userData?.business_category || "",
      abn_number: userData?.abn_number || "",
      service_category: userData?.service_category || "",
      business_service: userData?.business_service || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "business_service",
  });

  const onSubmit = async (data: any) => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="relative bg-white border rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="bg-slate-100 text-2xl font-bold">
                {session?.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {session?.user?.verified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* User Info Display */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {session?.user?.name}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {session?.user?.email}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {session?.user?.category}
                  </Badge>
                </div>
                <h1 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                  Business: {session?.user?.business_name}
                  <Badge variant="outline" className="capitalize">
                    {session?.user?.business_category}
                  </Badge>
                </h1>
              </div>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Profile Information</DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6">
                      {/* Image Upload Placeholder */}
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={form.watch("image")} />
                          <AvatarFallback>
                            <UserIcon />
                          </AvatarFallback>
                        </Avatar>
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Profile Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {session?.user?.category === "business" && (
                          <FormField
                            control={form.control}
                            name="abn_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ABN Number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {session?.user?.category === "business" && (
                        <div className="space-y-6 border-t pt-4">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Business Details
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="business_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="business_category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="restaurants">
                                        Restaurants
                                      </SelectItem>
                                      <SelectItem value="cafes">
                                        Cafes
                                      </SelectItem>
                                      <SelectItem value="others">
                                        Others
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <FormLabel>Services</FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  append({ name: "", price_category: "hr" })
                                }>
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            </div>
                            {fields.map((field, index) => (
                              <div
                                key={field.id}
                                className="p-4 border rounded-md bg-white relative">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7"
                                  onClick={() => remove(index)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Service name"
                                    {...form.register(
                                      `business_service.${index}.name`,
                                    )}
                                  />
                                  <Input
                                    placeholder="Price category"
                                    {...form.register(
                                      `business_service.${index}.price_category`,
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button type="submit" className="w-full">
                          Update Records
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Displaying Business Specific Info on Profile Page */}
            {userData?.category === "business" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <Building2 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Business
                    </p>
                    <p className="font-medium">{userData.business_name}</p>
                    <p className="text-sm text-slate-500">
                      {userData.business_category}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Tax ID / ABN
                    </p>
                    <p className="font-medium">
                      {userData.abn_number || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {userData?.category === "business" &&
        userData?.business_service?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userData.business_service.map(({ service, i }: any) => (
              <div
                key={i}
                className="p-4 border rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <h4 className="font-bold text-lg">{service.name}</h4>
                <Badge variant="secondary" className="mt-1 mb-2">
                  Per {service.price_category}
                </Badge>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {service.item_description}
                </p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default ProfilePage;
