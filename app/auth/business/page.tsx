"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

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
    abn_number: z
      .number()
      .min(10000000000, "ABN must be 11 digits")
      .max(99999999999, "ABN must be 11 digits"),
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
    <div className="max-w-md mx-auto p-6 bg-card border rounded-xl shadow-sm mt-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Create Business Account</h1>
        <p className="text-muted-foreground text-sm">
          Join our platform to grow your reach.
        </p>
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
            name="abn_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ABN Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="12345678901"
                    maxLength={11}
                    minLength={11}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Register Business
          </Button>
        </form>
      </Form>
    </div>
  );
}
