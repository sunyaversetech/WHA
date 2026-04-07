"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  User,
  Briefcase,
  Lock,
} from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LocationFormField } from "@/components/ui/LocationFormFiled";
import { Checkbox } from "@/components/ui/checkbox";

const communities = ["Australian", "Nepali", "Others"];
const categories = [
  { label: "Automotive", value: "automotive" },
  { label: "Barber", value: "barber" },
  { label: "Cafe", value: "cafe" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Electrician", value: "electrician" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Others", value: "others" },
];

const cities = [
  { label: "Sydney", value: "sydney" },
  { label: "Canberra", value: "canberra" },
  { label: "Other", value: "other" },
];

export const signupSchema = z
  .object({
    _id: z.string().optional(),
    name: z.string().min(2, "Contact name is required"),
    business_name: z.string().min(2, "Business name is required"),
    phone_number: z.string().min(10, "Valid phone number required"),
    business_category: z.string().min(1, "Select a category"),
    community: z.string().min(1, "Select a community"),
    city: z.string().min(1, "City is required"),
    location: z.string().min(2, "Location is required"),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    image: z
      .any()
      .refine(
        (file) => !file || file.size <= 3 * 1024 * 1024,
        "Max file size is 3MB",
      )
      .refine(
        (file) =>
          !file || ["image/jpeg", "image/jpg", "image/png"].includes(file.type),
        ".jpg, .jpeg, and .png files are accepted",
      )
      .optional(),
    email: z.email().min(1, "Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    accpetalltermsandcondition: z
      .boolean()
      .refine((val) => val === true, "Required"),
    category: z.literal("business"),
    city_name: z.string().optional(),
    community_name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SingUPFormSchema = z.infer<typeof signupSchema>;

const STEPS = [
  { id: 1, title: "Basic", icon: User },
  { id: 2, title: "Business", icon: Briefcase },
  { id: 3, title: "Security", icon: Lock },
];

export default function BusinessSignup() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { mutate, isPending } = useSingup();

  const form = useForm<SingUPFormSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      business_name: "",
      phone_number: "",
      business_category: "",
      community: "",
      city: "",
      location: "",
      email: "",
      password: "",
      confirmPassword: "",
      category: "business",
      accpetalltermsandcondition: false,
    },
  });

  const nextStep = async () => {
    const fields =
      step === 1
        ? ["name", "business_name", "phone_number"]
        : ["business_category", "community", "city", "location"];

    const isValid = await form.trigger(fields as any);
    if (isValid) setStep((s) => s + 1);
  };

  const onSubmit = (values: SingUPFormSchema) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob);
      }
    });

    mutate(formData, {
      onSuccess: () => {
        toast.success("Registration successful!");
        router.push("/auth?tab=login");
      },
      onError: (err: any) => {
        const errorMessage =
          err?.response?.data?.message || err?.message || "Error occurred";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 bg-white/90 backdrop-blur-md border rounded-2xl shadow-2xl">
      <div className="mb-8">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                step > 1 ? setStep(step - 1) : router.push("/auth?tab=login")
              }
              className="rounded-full border">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-between flex-1 max-w-md mx-auto px-4">
              {STEPS.map((s, index) => (
                <React.Fragment key={s.id}>
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-white",
                        step >= s.id
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 text-slate-400",
                      )}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                        step >= s.id ? "text-primary" : "text-slate-400",
                      )}>
                      {s.title}
                    </span>
                  </div>

                  {index !== STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 bg-slate-100">
                      <div
                        className={cn(
                          "h-full bg-primary transition-all duration-500",
                          step > s.id ? "w-full" : "w-0",
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="w-10" />
          </div>

          <div className="text-center mt-4">
            <h1 className="text-2xl font-bold">WHA Business Account</h1>
            <p className="text-muted-foreground text-sm">Step {step} of 3</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
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
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+61 000 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="business_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(v) => v && field.onChange(v)}
                        className="flex flex-wrap gap-2 justify-start">
                        {categories.map((c) => (
                          <ToggleGroupItem
                            key={c.value}
                            value={c.value}
                            className="px-4 border rounded-md! data-[state=on]:bg-primary data-[state=on]:text-white">
                            {c.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="community"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(v) => v && field.onChange(v)}
                          className="flex gap-2">
                          {communities.map((c) => (
                            <ToggleGroupItem
                              key={c}
                              value={c.toLowerCase()}
                              className="flex-1 border rounded-md! data-[state=on]:bg-primary data-[state=on]:text-white">
                              {c}
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
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(v) => v && field.onChange(v)}
                          className="flex gap-2">
                          {cities.map((c) => (
                            <ToggleGroupItem
                              key={c.value}
                              value={c.value}
                              className="flex-1 border rounded-md! data-[state=on]:bg-primary data-[state=on]:text-white">
                              {c.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <LocationFormField form={form} />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center justify-center w-full">
                        <label
                          className={cn(
                            "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 hover:border-primary/50",
                            form.formState.errors.image &&
                              "border-destructive bg-destructive/5",
                          )}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                              <Camera className="w-6 h-6 text-primary" />
                            </div>
                            <p className="mb-1 text-sm font-semibold text-slate-700">
                              {field.value
                                ? field.value.name
                                : "Click to upload logo"}
                            </p>
                            <p className="text-xs text-slate-500">
                              PNG, JPG or JPEG (Max. 3MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".png, .jpg, .jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (file.size > 3 * 1024 * 1024) {
                                toast.error("File is too large! Limit is 3MB.");
                                return;
                              }

                              const validTypes = [
                                "image/png",
                                "image/jpeg",
                                "image/jpg",
                              ];
                              if (!validTypes.includes(file.type)) {
                                toast.error(
                                  "Invalid format! Please use PNG or JPG.",
                                );
                                return;
                              }

                              field.onChange(file);
                              toast.success(`Selected: ${file.name}`);
                            }}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
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
                      <FormLabel>Confirm</FormLabel>
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accpetalltermsandcondition"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-none text-sm">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>
                      .
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                className="flex-1"
                onClick={(e) => {
                  nextStep();
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1 bg-primary">
                {isPending ? "Registering..." : "Register Business"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
