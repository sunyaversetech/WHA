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
import { useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.email().min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    cpassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters"),
    category: z.enum(["user", "business"]),
    accpetalltermsandcondition: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service",
    }),
  })
  .refine((data) => data.password === data.cpassword, {
    message: "Passwords don't match",
  });

export default function SignupPage() {
  const router = useRouter();
  const { mutate } = useSingup();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      category: "user",
      accpetalltermsandcondition: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    mutate(values as any, {
      onSuccess: () => {
        toast.success("Signup successful! Please log in.");
        router.replace("/auth?tab=login");
      },
      onError: (error) => {
        toast.error(error.message || "Signup failed. Please try again.");
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center mt-[20vh]">
      <div className="w-full max-w-md space-y-2 rounded-xl bg-white">
        <h3 className="text-3xl my-2 flex gap-5 text-left">
          <Button
            className="rounded-full w-10 h-10 text-left p-0"
            onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5 p-0  " />
          </Button>
          Signup For User
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  {/* <FormLabel>Full Name</FormLabel> */}
                  <FormControl>
                    <Input
                      className="focus:outline-none focus:ring-0 focus-visible:ring-0"
                      placeholder="Full Name"
                      {...field}
                    />
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
                  {/* <FormLabel>Email</FormLabel> */}
                  <FormControl>
                    <Input
                      className="focus:outline-none focus:ring-0 focus-visible:ring-0"
                      placeholder="Email address"
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
                  {/* <FormLabel>Password</FormLabel> */}
                  <div className="relative">
                    <FormControl>
                      <Input
                        className="focus:outline-none focus:ring-0 focus-visible:ring-0"
                        placeholder="Password"
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
              name="cpassword"
              render={({ field }) => (
                <FormItem>
                  {/* <FormLabel>Password</FormLabel> */}
                  <div className="relative">
                    <FormControl>
                      <Input
                        className="focus:outline-none focus:ring-0 focus-visible:ring-0"
                        placeholder="Confirm Password"
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
                    <div className="leading-none flex">
                      <FormLabel className="text-sm font-normal flex">
                        <div className="gap-2 space-x-2">
                          I agree to the
                          <a
                            className="text-red-600 ml-2 hover:underline"
                            href="/privacy">
                            Privacy Policy,
                          </a>
                          <a
                            className="text-red-600 hover:underline"
                            href="/privacy">
                            Terms of Service,
                          </a>
                          <a
                            className="text-red-600 hover:underline"
                            href="/privacy">
                            Terms of Business
                          </a>
                        </div>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </form>
        </Form>
        <div className="text-start pt-4">
          <h1 className="text-lg font-bold">Have a business? </h1>
          <Link href="/auth/business" className="text-primary font-medium">
            Register in as a business
          </Link>
        </div>
      </div>
    </div>
  );
}
