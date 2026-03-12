"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Import your mutation hook
import { useVerifyCode } from "@/services/Auth/auth.service";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// 1. Define Validation Schema
const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your verification code must be 6 characters.",
  }),
});

export default function VerifyCode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // 2. Initialize Mutation
  const { mutate, isPending } = useVerifyCode();

  // 3. Initialize Form
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  // 4. Handle Submission
  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!email) {
      toast.error("Email is missing. Please start the process again.");
      return;
    }

    mutate(
      { email, code: data.pin },
      {
        onSuccess: () => {
          toast.success("Code verified successfully!");
          router.push(`/reset-password?email=${email}&code=${data.pin}`);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error || "Invalid or expired code.",
          );
          form.reset();
        },
      },
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 space-y-6 border rounded-2xl bg-white shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Verify Code</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 flex flex-col items-center">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel className="sr-only">Verification Code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup className="gap-2 sm:gap-4">
                        <InputOTPSlot
                          index={0}
                          className="rounded-md border-2"
                        />
                        <InputOTPSlot
                          index={1}
                          className="rounded-md border-2"
                        />
                        <InputOTPSlot
                          index={2}
                          className="rounded-md border-2"
                        />
                        <InputOTPSlot
                          index={3}
                          className="rounded-md border-2"
                        />
                        <InputOTPSlot
                          index={4}
                          className="rounded-md border-2"
                        />
                        <InputOTPSlot
                          index={5}
                          className="rounded-md border-2"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Please enter the one-time password sent to your email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-lg h-11"
              disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
