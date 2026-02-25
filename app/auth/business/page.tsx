"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronsUpDown, Eye, EyeOff } from "lucide-react";

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

import * as z from "zod";
import { useSingup } from "@/services/Auth/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LocationFormField } from "@/components/ui/LocationFormFiled";
import { Checkbox } from "@/components/ui/checkbox";

const categories = [
  { label: "Automotive", value: "automotive" },
  { label: "Barber", value: "barber" },
  { label: "Cafe", value: "cafe" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Consultancy", value: "consultancy" },
  { label: "Driving School", value: "driving-school" },
  { label: "Electrician", value: "electrician" },
  { label: "Event Organizer", value: "event-organizer" },
  { label: "Food Truck", value: "food-truck" },
  { label: "Grocery", value: "grocery" },
  { label: "Painter", value: "painter" },
  { label: "Photography", value: "photography" },
  { label: "Plumber", value: "plumber" },
  { label: "Pujari", value: "pujari" },
  { label: "Removalists", value: "removalists" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Saloon and Makeup", value: "saloon-makeup" },
  { label: "Shop", value: "shop" },
  { label: "Social Club", value: "social-club" },
  { label: "Travel and Tours", value: "travel-tours" },
  { label: "Others", value: "others" },
] as const;

const communities = [
  "Australian",
  "Nepali",
  "Indian",
  "Bhutanese",
  "European",
  "Others",
];

const cities = [
  { label: "Sydney", value: "sydney" },
  { label: "Melbourne", value: "melbourne" },
  { label: "Brisbane", value: "brisbane" },
  { label: "Perth", value: "perth" },
  { label: "Adelaide", value: "adelaide" },
  { label: "Canberra", value: "canberra" },
  { label: "Hobart", value: "hobart" },
  { label: "Darwin", value: "darwin" },
  { label: "Newcastle", value: "newcastle" },
  { label: "Gold Coast", value: "gold-coast" },
  { label: "Other", value: "other" },
];

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email().min(1, "Please enter a valid email address"),
    business_name: z.string().min(2, "Business name is required"),
    business_category: z.string().min(1, "Please select a category"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    city: z.string().min(1, "City is required"),
    accpetalltermsandcondition: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service",
    }),
    community: z.string().min(1, "Please select a community"),
    location: z.string().min(2, "Location is required"),
    confirmPassword: z.string(),
    category: z.enum(["user", "business"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SingUPFormSchema = z.infer<typeof signupSchema>;

export default function BusinessSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { mutate } = useSingup();

  const form = useForm<SingUPFormSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      city: "",
      business_name: "",
      business_category: "",
      password: "",
      confirmPassword: "",
      category: "business",
      community: "",
      location: "",
      accpetalltermsandcondition: false,
    },
  });

  function onSubmit(values: SingUPFormSchema) {
    mutate(values, {
      onSuccess: () => {
        toast.success("Signup successful! Please log in.");
        router.push("/auth?tab=login");
      },
      onError: (error) => {
        const errorMessage =
          error?.message ||
          (typeof error === "string" ? error : "An unexpected error occurred");
        toast.error(errorMessage);
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card border rounded-xl shadow-sm m-10">
      <div className="flex mb-6 text-center items-center">
        <div
          className="flex items-start justify-start p-4 -ml-4"
          onClick={() => router.push("/auth?tab=login")}>
          <ChevronLeft
            className="h-8 w-8 cursor-pointer rounded-full border bg-white p-1.5 
               text-slate-600 
               transition-all hover:scale-105 active:scale-95"
          />
        </div>
        <div className="flex flex-col justify-center m-auto items-center ">
          <h1 className="text-2xl font-bold flex justify-center">
            WHA Business Account
          </h1>
          <p className="text-muted-foreground text-sm">
            Join our platform to manage your business.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="business_category"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}>
                        {field.value
                          ? categories.find((cat) => cat.value === field.value)
                              ?.label
                          : "Select a category"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-xl p-0">
                    <Command>
                      <CommandInput
                        className="focus: focus-visible:ring-0 focus-visible:border-0"
                        placeholder="Search category..."
                      />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              value={category.label}
                              key={category.value}
                              onSelect={() => {
                                form.setValue(
                                  "business_category",
                                  category.value,
                                );
                              }}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {category.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="community"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Community</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                    value={field.value}
                    className="flex flex-wrap justify-start gap-2">
                    {communities.map((item) => (
                      <ToggleGroupItem
                        key={item}
                        value={item.toLowerCase()}
                        className={cn(
                          "!rounded-md !border border-input h-10 px-4",
                          "min-w-[100px] transition-all",
                          "hover:bg-accent hover:text-accent-foreground",
                          "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:opacity-100",
                          "first:rounded-md last:rounded-md",
                        )}>
                        {item}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>City</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}>
                        {field.value
                          ? cities.find((city) => city.value === field.value)
                              ?.label
                          : "Select a City"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-xl p-0">
                    <Command>
                      <CommandInput
                        className="focus: focus-visible:ring-0 focus-visible:border-0"
                        placeholder="Search City..."
                      />
                      <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {cities.map((city) => (
                            <CommandItem
                              value={city.label}
                              key={city.value}
                              onSelect={() => {
                                form.setValue("city", city.value);
                              }}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  city.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {city.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <LocationFormField form={form} />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="work@business.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 max-w-xl">
            {/* 1. Privacy Policy */}
            <FormField
              control={form.control}
              name="accpetalltermsandcondition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="leading-none">
                    <FormLabel className="text-sm font-normal">
                      I agree to the{" "}
                      <a
                        className="text-red-600 hover:underline"
                        href="/privacy">
                        Privacy Policy
                      </a>
                      <a
                        className="text-red-600 hover:underline"
                        href="/privacy">
                        Terms of Service
                      </a>
                      <a
                        className="text-red-600 hover:underline"
                        href="/privacy">
                        Terms of Business
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            // disabled={!form.formState.isValid}
            className="w-full">
            Register Business
          </Button>
        </form>
      </Form>
    </div>
  );
}
