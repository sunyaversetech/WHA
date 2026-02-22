// app/signup/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useSingup } from "@/services/Auth/auth.service";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.email().min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    cpassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters"),
    category: z.enum(["user", "business"]),
  })
  .refine((data) => data.password === data.cpassword, {
    message: "Passwords don't match",
  });

export default function SignupPage() {
  const router = useRouter();
  const { mutate } = useSingup();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", category: "user" },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    mutate(values as any, {
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
  };

  return (
    <div className="flex ">
      <div className="w-full max-w-md space-y-2 rounded-xl bg-white px-8 ">
        <h2 className="text-xl font-bold text-center">
          Have a Business?
        </h2>
        <Link
          href="/auth/business"
          className="block text-center text-sm text-blue-500  hover:text-gray-700">
          Sign up as Business Account
        </Link>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
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
                    <Input placeholder="email@example.com" {...field} />
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
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm">
    
              <p>
                I agree to the <a className="text-red-600" href="">Privacy Policy</a>, <a className="text-red-600" href="">Terms of Service</a> and <a className="text-red-600" href="">Terms of Business.</a>
              </p>
             
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700">
              Sign Up
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-gray-500 pt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-red-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
