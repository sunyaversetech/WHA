"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import ProfileAvatar from "../Dashboard/ProfilePic";

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

  const profileImage = useWatch({
    control: form.control,
    name: "image",
  });

  const onSubmit = async (data: any) => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="relative bg-white border rounded-2xl p-8 shadow-sm">
        <div className="bg-white flex justify-between rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProfileAvatar currentImage={session?.user?.image || ""} />
              </div>

              <div className="flex-1">
                <div className="flex  flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-800">
                    {session?.user?.business_name}
                  </h1>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-tighter">
                      {session?.user?.category || "Personal Account"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-tighter">
                      {session?.user?.verified
                        ? "Verified"
                        : "Business Not Verified"}
                    </Badge>
                  </div>
                </div>

                {/* Email */}
                <p className="text-sm text-slate-500 mt-2">
                  {session?.user?.email}
                  {/* Optional pending approvals */}
                  {/* • <span className="text-orange-500 font-semibold underline">21</span> Pending Approvals */}
                </p>
              </div>
            </div>
          </header>
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
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profileImage} />
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
                                  <SelectItem value="cafes">Cafes</SelectItem>
                                  <SelectItem value="others">Others</SelectItem>
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
