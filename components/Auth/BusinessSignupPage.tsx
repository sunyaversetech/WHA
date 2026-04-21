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
  Car,
  ScissorsLineDashed,
  Coffee,
  BrushCleaning,
  Store,
  ScanHeart,
  Hammer,
  Gem,
  PlaneTakeoff,
  BookOpenCheck,
  Cable,
  ChartBarStacked,
  Paintbrush,
  Move,
  Calendar,
  Van,
  CarTaxiFront,
  ChefHat,
  Pin,
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
  { label: "Automotive", value: "automotive", icon: <Car /> },
  { label: "Cleaning", value: "cleaning", icon: <BrushCleaning /> },
  { label: "Electrician", value: "electrician", icon: <Cable /> },
  { label: "Restaurant", value: "restaurant", icon: <Coffee /> },
  { label: "Consultancy", value: "consultancy", icon: <BookOpenCheck /> },
  { label: "Travel", value: "travel and tours", icon: <PlaneTakeoff /> },
  { label: "Wedding Planner", value: "wedding", icon: <Gem /> },
  { label: "Pujari", value: "pujari", icon: <User /> },
  { label: "Painter", value: "painter", icon: <Paintbrush /> },
  { label: "Cafe", value: "cafe", icon: <Coffee /> },
  { label: "Grocery", value: "grocery", icon: <Store /> },
  { label: "Event", value: "event-organizer", icon: <Calendar /> },
  { label: "Removalists", value: "removalists", icon: <Move /> },
  { label: "Saloon", value: "barber", icon: <ScissorsLineDashed /> },
  { label: "Plumber", value: "plumber", icon: <Hammer /> },
  { label: "driving school", value: "driving school", icon: <CarTaxiFront /> },
  { label: "Social Club", value: "social club", icon: <User /> },
  { label: "food truck", value: "food truck", icon: <Van /> },
  { label: "Catering", value: "catering", icon: <ChefHat /> },
  {
    label: "Photography & Videography",
    value: "photography",
    icon: <Camera />,
  },
  { label: "Health & Wellness", value: "health", icon: <ScanHeart /> },
  { label: "Retails Shop", value: "retails", icon: <Store /> },
  { label: "Others", value: "others", icon: <User /> },
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
  { id: 1, title: "Business Info", icon: Briefcase },
  { id: 2, title: "Category", icon: ChartBarStacked },
  { id: 3, title: "Business Location", icon: Pin },
  { id: 4, title: "Personal Info", icon: User },
  { id: 5, title: "Security", icon: Lock },
];

export default function BusinessSignup() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
        ? ["business_name", "image"]
        : step === 2
          ? ["business_category"]
          : step === 3
            ? ["city", "location"]
            : ["community"];

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
    <div className="w-full justify-center items-center max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 backdrop-blur-md rounded-2xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
        className="rounded-full border">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="mb-6 sm:mb-8 mt-[5vh] sm:mt-[10vh]">
        <div className="text-center mt-4 mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-bold">
            WHA Business Account Signup
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Step {step} of 5</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center w-full justify-between mb-6 sm:mb-8">
            <div className="flex items-center justify-between flex-1 w-full mx-auto px-2 sm:px-4">
              {STEPS.map((s, index) => (
                <React.Fragment key={s.id}>
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-white",
                        step >= s.id
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 text-slate-400",
                      )}>
                      <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span
                      className={cn(
                        "absolute hidden sm:block -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                        step >= s.id ? "text-primary" : "text-slate-400",
                      )}>
                      {s.title}
                    </span>
                  </div>

                  {index !== STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-1 sm:mx-2 bg-slate-100">
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
            <div className="w-8 sm:w-10" />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Business name..."
                        {...field}
                        className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden",
                            "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 hover:border-primary/50",
                            form.formState.errors.image &&
                              "border-destructive bg-destructive/5",
                            imagePreview ? "h-48 sm:h-64" : "h-36 sm:h-40",
                          )}>
                          {imagePreview ? (
                            /* Image Preview */
                            <div className="relative w-full h-full">
                              <img
                                src={imagePreview}
                                alt="Business logo preview"
                                className="w-full h-full object-contain p-2"
                              />
                              <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity bg-black/10 rounded-xl">
                                <span className="text-xs font-semibold text-white bg-black/50 px-3 py-1 rounded-full">
                                  Click to change
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Upload Placeholder */
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                              <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                <Camera className="w-6 h-6 text-primary" />
                              </div>
                              <p className="mb-1 text-sm font-semibold text-slate-700">
                                Click to upload logo
                              </p>
                              <p className="text-xs text-slate-500">
                                PNG, JPG or JPEG (Max. 3MB)
                              </p>
                            </div>
                          )}
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

                              // Generate preview URL
                              const previewUrl = URL.createObjectURL(file);
                              setImagePreview(previewUrl);

                              field.onChange(file);
                              toast.success(`Selected: ${file.name}`);
                            }}
                          />
                        </label>
                        {/* Show filename below if image selected */}
                        {field.value && (
                          <p className="mt-2 text-xs text-slate-500 truncate max-w-full px-2">
                            {field.value.name}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="flex items-center justify-center m-auto">
              <FormField
                control={form.control}
                name="business_category"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="ml-1 sm:ml-5">Category</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(v) => v && field.onChange(v)}
                        className="flex flex-wrap gap-2 justify-center">
                        {categories.map((c) => (
                          <ToggleGroupItem
                            key={c.value}
                            value={c.value}
                            className="px-3 sm:px-4 border text-left items-start rounded-md! flex-col h-20 sm:h-25 w-[calc(50%-4px)] xs:w-36 sm:w-44 md:w-60 data-[state=on]:bg-primary data-[state=on]:text-white">
                            {c.icon}
                            <span className="text-wrap text-xs sm:text-sm">
                              {c.label}
                            </span>
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Business Location */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                        className="flex flex-wrap gap-2 justify-center">
                        {cities.map((c) => (
                          <ToggleGroupItem
                            key={c.value}
                            value={c.value}
                            className="px-4 border rounded-md! flex-col h-16 sm:h-20 w-[calc(33%-6px)] sm:w-44 md:w-60 data-[state=on]:bg-primary data-[state=on]:text-white text-sm sm:text-base">
                            {c.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LocationFormField form={form} />
            </div>
          )}

          {/* Step 4: Personal Info */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
                      />
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
                    <FormLabel>Contact Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+61 000 000 000"
                        {...field}
                        className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="flex flex-wrap gap-2 justify-center">
                        {communities.map((c) => (
                          <ToggleGroupItem
                            key={c}
                            value={c.toLowerCase()}
                            className="px-4 border rounded-md! flex-col h-16 sm:h-20 w-[calc(33%-6px)] sm:w-44 md:w-60 data-[state=on]:bg-primary data-[state=on]:text-white text-sm sm:text-base">
                            {c}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 5: Security */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <Input
                          className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
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
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <Input
                          className="h-12 sm:h-15 text-base focus:outline-none focus:ring-0 focus-visible:ring-0"
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
              </div>

              <FormField
                control={form.control}
                name="accpetalltermsandcondition"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 sm:p-4 border rounded-lg">
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

          <div className="flex gap-3 sm:gap-4 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 sm:h-15 text-base sm:text-xl"
                onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}

            {step < 5 ? (
              <Button
                type="button"
                className="flex-1 h-12 sm:h-15 text-base sm:text-xl"
                onClick={(e) => {
                  nextStep();
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                Next <ArrowRight className="ml-2 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-primary h-12 sm:h-15 text-base sm:text-xl">
                {isPending ? "Registering..." : "Register Business"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
