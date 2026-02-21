// app/login/page.tsx
"use client";
import { signIn, useSession } from "next-auth/react";
import { Chrome, Chromium } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

const loginSchema = z.object({
  email: z.email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data } = useSession();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  console.log("data", data);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: values.email.toLowerCase().trim(),
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      console.error("Auth Error Type:", result);
      toast.error(
        `${result.status === 401 ? "Invalid email or password. Please try again." : "An error occurred during login. Please try again later."}`,
      );
      setLoading(false);
    } else if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <div className="flex ">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 ">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <Chromium className="h-5 w-5 text-red-500" />
          Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          New here?{" "}
          <Link href="/signup" className="text-red-600 font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
