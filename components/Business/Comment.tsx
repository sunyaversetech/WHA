"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star, User, Loader2, Send, Edit, BadgeCheck } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useReplyReview,
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
  businessId,
}: {
  reviews: ReviewType[];
  businessId?: string;
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
  const { mutate: replyToReview, isPending: isReplying } = useReplyReview();

  const canReply = !!session?.user?.id;
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const totalReviews = reviews?.length ?? 0;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : null;
  const PREVIEW_COUNT = 4;
  const visibleReviews = showAll
    ? (reviews ?? [])
    : (reviews ?? []).slice(0, PREVIEW_COUNT);

  const submitReply = (reviewId: string) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) return;
    replyToReview(
      { id: reviewId, reply: text },
      {
        onSuccess: () => {
          toast.success("Reply posted");
          setOpenReplyFor(null);
          setReplyDrafts((d) => ({ ...d, [reviewId]: "" }));
          queryClient.invalidateQueries({ queryKey: ["review"] });
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error || "Failed to post reply");
        },
      },
    );
  };

  useEffect(() => {
    if (!reviews?.length) return;
    const hash = window.location.hash;
    if (!hash) return;
    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reviews]);

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

  return (
    <div className=" mx-auto space-y-4 md:card-lg md:p-4 md:p-6 pb-4 md:pb-0">
      <div className="space-y-6 mt-10">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Reviews
            </h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
              {totalReviews}
            </span>
          </div>
          {totalReviews > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
              {showAll ? "Show less" : "See all"}
            </button>
          )}
        </div>

        {totalReviews > 0 && avgRating !== null && (
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-3xl font-bold text-slate-900">
                {avgRating.toFixed(1)}
              </span>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-slate-600 leading-relaxed">
                {totalReviews === 1
                  ? "1 customer has reviewed this business."
                  : `${totalReviews} customers have reviewed this business, rating it ${avgRating.toFixed(1)} out of 5 on average.`}
              </p>
              <div className="flex items-center -space-x-2 mt-2">
                {reviews.slice(0, 5).map((r) => (
                  <Avatar
                    key={r._id}
                    className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={r.user?.image} className="object-cover" />
                    <AvatarFallback className="text-[10px] bg-primary text-white">
                      {r.user?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {totalReviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                businessId={businessId}
                session={session}
                canReply={canReply}
                isReplying={isReplying}
                openReplyFor={openReplyFor}
                setOpenReplyFor={setOpenReplyFor}
                replyDraft={replyDrafts[review._id] || ""}
                setReplyDraft={(text) =>
                  setReplyDrafts((d) => ({ ...d, [review._id]: text }))
                }
                submitReply={() => submitReply(review._id)}
                onEdit={() => {
                  form.setValue("comment", review?.comment);
                  form.setValue("rating", review?.rating);
                  form.setValue("review_id", review?._id);
                }}
                onDelete={() => handleDelete(review._id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden p-0 mt-0">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-gray-800 ">
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

              <div className="flex justify-end mb-4">
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
    </div>
  );
}

function ReviewCard({
  review,
  businessId,
  session,
  canReply,
  isReplying,
  openReplyFor,
  setOpenReplyFor,
  replyDraft,
  setReplyDraft,
  submitReply,
  onEdit,
  onDelete,
}: {
  review: ReviewType;
  businessId?: string;
  session: ReturnType<typeof useSession>["data"];
  canReply: boolean;
  isReplying: boolean;
  openReplyFor: string | null;
  setOpenReplyFor: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (text: string) => void;
  submitReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOwner = session?.user?.id === review.user?._id;
  const isSuperAdmin = session?.user?.category === "super-admin";

  return (
    <div
      id={`review-${review._id}`}
      className="p-5 rounded-2xl border border-slate-100 scroll-mt-24 hover:border-slate-200 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={review?.user?.image} className="object-cover" />
            <AvatarFallback className="bg-primary text-white font-semibold">
              {review?.user?.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm truncate">
                {review?.user?.name}
              </span>
              {isOwner && (
                <span className="text-xs text-slate-400">(You)</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-200",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNowStrict(new Date(review.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label="Edit your review"
              onClick={onEdit}
              className="p-1.5 rounded-md text-slate-400 hover:text-green-600 hover:bg-slate-50 transition-colors">
              <Edit size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Every review now requires a completed booking with the business
         (enforced server-side) - this is always true, not a per-review claim
         about which service or staff member it was for. */}
      <p className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-2">
        <BadgeCheck size={13} />
        Verified booking
      </p>

      <ReviewComment text={review.comment} />

      {(isOwner || isSuperAdmin) && (
        <div className="mt-2">
          <DeleteConfirmDialog onConfirm={onDelete} text={review?.comment} />
        </div>
      )}

      {review.replies?.length > 0 && (
        <div className="mt-4 ml-6 space-y-3">
          {review.replies.map((reply) => (
            <div
              key={reply._id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                {reply.user?._id === businessId
                  ? reply.user?.business_name || "Business"
                  : reply.user?.name || "User"}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {reply.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {canReply &&
        (openReplyFor === review._id ? (
          <div className="mt-4 ml-6 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              className="min-h-20 bg-slate-50/50"
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenReplyFor(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isReplying}
                onClick={submitReply}>
                {isReplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Post reply"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="mt-3 ml-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => setOpenReplyFor(review._id)}>
            Reply to this review
          </button>
        ))}
    </div>
  );
}

function ReviewComment({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 180;

  return (
    <div>
      <p
        className={cn(
          "text-slate-600 leading-relaxed text-sm",
          !expanded && isLong && "line-clamp-3",
        )}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-semibold text-slate-700 hover:underline mt-1">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
