"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Star,
  MessageSquare,
  User,
  Loader2,
  Send,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ReviewType,
  useCreateReview,
  useDeleteReview,
  useGetReview,
} from "@/services/review.service";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DeleteConfirmDialog } from "../ui/DynamicDeleteButton";

const reviewSchema = z.object({
  review_id: z.string().optional(),
  business_id: z.string().optional(),
  rating: z.number().min(1, "Please select at least 1 star").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export type Reviews = z.infer<typeof reviewSchema>;

export default function BusinessReviewSection({
  reviews,
}: {
  reviews: ReviewType[];
}) {
  const form = useForm<Reviews>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });
  const params = useParams();
  const { id } = params;
  const { data: session, status } = useSession();
  // const { data: reviews } = useGetReview(String(id));
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate } = useCreateReview();
  const { mutate: deleteReview } = useDeleteReview();

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (status === "unauthenticated") {
      router.push("/auth");
      toast.error("Please login to leave a review");
    }
    mutate(
      { ...values, business_id: String(id) },
      {
        onSuccess: () => {
          form.reset();

          toast.success(
            values.review_id
              ? "Review updated successfully"
              : "Review created successfully",
          );
          queryClient.invalidateQueries({ queryKey: ["review"] });
        },
        onError: (error: any) => {
          console.log(error);
          toast.error(String(error) || "Failed to create review");
          console.error(
            error.response?.data?.message || "Failed to create review",
          );
        },
      },
    );
  }

  const handleDelete = (id: string) => {
    deleteReview(
      { id: id },
      {
        onSuccess: () => {
          toast.success("Review deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["review"] });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete review",
          );
        },
      },
    );
  };

  console.log("reviews", reviews);
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Leave a Review
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      How would you rate your experience? *
                    </FormLabel>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-8 h-8 cursor-pointer transition-all hover:scale-110",
                            star <= field.value
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300",
                          )}
                          onClick={() => field.onChange(star)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Your Feedback *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your thoughts here..."
                        className="min-h-[120px] bg-slate-50/50 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit">
                  {false ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  Post Review
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6 mt-10">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-2xl font-bold text-slate-900">Recent Reviews</h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
            {reviews?.length}
          </span>
        </div>

        <Separator />

        <div className="space-y-4">
          {reviews && reviews?.length > 0 ? (
            reviews?.map((review) => (
              <div
                key={review._id}
                className="p-6 rounded-2xl border   hover:border-slate-200 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={review.user?.image}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-white">
                        {review.user?.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex justify-between gap-2 items-center">
                      {session?.user?.id === review.user?._id && (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md h-6.5 text-sm font-medium">
                          You
                        </span>
                      )}
                      {session?.user?.id === review.user?._id && (
                        <span className=" text-green-600 px-3 py-1.5 rounded-md h-6.5 text-sm font-medium">
                          <Edit
                            size={15}
                            onClick={() => {
                              form.setValue("comment", review.comment);
                              form.setValue("rating", review.rating);
                              form.setValue("review_id", review._id);
                            }}
                          />
                        </span>
                      )}
                      {session?.user?.id === review.user?._id && (
                        <DeleteConfirmDialog
                          onConfirm={() => handleDelete(review._id)}
                          text={review.comment}
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-none"></h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(review.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-200",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed pl-1">
                  {review.comment}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
              <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
