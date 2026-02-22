"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronLeft, Eye, EyeOff } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as z from "zod";
import { useSingup } from "@/services/Auth/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email().min(1, "Please enter a valid email address"),
    business_name: z.string().min(2, "Business name is required"),
    business_category: z.string().min(1, "Please select a category"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
      business_name: "",
      business_category: "",
      password: "",
      confirmPassword: "",
      category: "business",
    },
  });

  console.log("Business Signup Form Data:", form.formState.errors);

  function onSubmit(values: SingUPFormSchema) {
    mutate(values, {
      onSuccess: () => {
        toast.success("Signup successful! Please log in.");
        router.push("/auth?tab=login");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Signup failed. Please try again.",
        );
      },
    });
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card border rounded-xl shadow-sm m-10">
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
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="restaurants">Restaurants</SelectItem>
                    <SelectItem value="cafes">Cafés</SelectItem>
                    <SelectItem value="food_trucks">Food Trucks</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="salons">Salons</SelectItem>
                    <SelectItem value="consultancies">Consultancies</SelectItem>
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

          <div className="text-sm">
            <p>
              I agree to the{" "}
              <a className="text-red-600" href="">
                Privacy Policy
              </a>
              ,{" "}
              <a className="text-red-600" href="">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="text-red-600" href="">
                Terms of Business.
              </a>
            </p>
          </div>

          <Button type="submit" className="w-full">
            Register Business
          </Button>
        </form>
      </Form>
    </div>
  );
}
