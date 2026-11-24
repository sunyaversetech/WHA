"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star, User, Loader2, Send, Edit, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

const REVIEWS_PREVIEW_COUNT = 6;
const COMMENT_PREVIEW_LENGTH = 140;

function initialsOf(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Lifted to module scope (not a closure inside BusinessReviewSection) so it
// isn't redefined every render — matches the fix already applied to
// MobileUserDropdown/MobileAuthSection for the same react-hooks/static-components rule.
function ReviewCard({
  review,
  businessId,
  currentUserId,
  isSuperAdmin,
  canReply,
  isReplyOpen,
  replyDraft,
  isReplying,
  commentExpanded,
  onReplyDraftChange,
  onOpenReply,
  onCancelReply,
  onSubmitReply,
  onEdit,
  onDelete,
  onExpandComment,
}: {
  review: ReviewType;
  businessId?: string;
  currentUserId?: string;
  isSuperAdmin: boolean;
  canReply: boolean;
  isReplyOpen: boolean;
  replyDraft: string;
  isReplying: boolean;
  commentExpanded: boolean;
  onReplyDraftChange: (value: string) => void;
  onOpenReply: () => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExpandComment: () => void;
}) {
  const isOwn = currentUserId === review.user?._id;
  const isLongComment = review.comment.length > COMMENT_PREVIEW_LENGTH;

  return (
    <div id={`review-${review._id}`} className="scroll-mt-24">
      <div className="flex items-start gap-3">
        <Avatar className="bg-indigo-100 shrink-0">
          <AvatarImage src={review?.user?.image} className="object-cover" />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
            {initialsOf(review?.user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              {review?.user?.name}
            </span>
            {isOwn && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">
                You
              </span>
            )}
            {isOwn && (
              <Edit
                size={14}
                className="text-slate-400 hover:text-green-600 cursor-pointer"
                onClick={onEdit}
              />
            )}
            {(isOwn || isSuperAdmin) && (
              <DeleteConfirmDialog onConfirm={onDelete} text={review?.comment} />
            )}
          </div>
          <div className="flex gap-0.5 mt-1">
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
          <p
            className={cn(
              "text-slate-600 leading-relaxed mt-2",
              !commentExpanded && isLongComment && "line-clamp-3",
            )}>
            {review.comment}
            {isLongComment && !commentExpanded && (
              <>
                {" "}
                <button
                  type="button"
                  className="text-blue-600 font-medium hover:underline whitespace-nowrap"
                  onClick={onExpandComment}>
                  Read more
                </button>
              </>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {formatDistanceToNow(new Date(review.created_at), {
              addSuffix: true,
            })}
          </p>

          {review.replies?.length > 0 && (
            <div className="mt-3 space-y-2">
              {review.replies.map((reply) => (
                <div
                  key={reply._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100">
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
            (isReplyOpen ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  className="min-h-20 bg-slate-50/50"
                  value={replyDraft}
                  onChange={(e) => onReplyDraftChange(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancelReply}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isReplying}
                    onClick={onSubmitReply}>
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
                className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                onClick={onOpenReply}>
                Reply to this review
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

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
  const [reviewsDrawerOpen, setReviewsDrawerOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null;
  const hasMoreReviews = (reviews?.length ?? 0) > REVIEWS_PREVIEW_COUNT;
  const visibleReviews = (reviews ?? []).slice(0, REVIEWS_PREVIEW_COUNT);

  const isSuperAdmin = session?.user?.category === "super-admin";
  const currentUserId = session?.user?.id;

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
    <div className=" mx-auto space-y-4 md:card-lg md:pb-4 pb-4 md:pb-0">
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2.5 justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Reviews
            </h2>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-sm font-medium">
              {reviews?.length ?? 0}
            </span>
          </div>
          {hasMoreReviews && (
            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:underline"
              onClick={() => setReviewsDrawerOpen(true)}>
              See all
            </button>
          )}
        </div>

        {avgRating !== null && (
          <div className="flex items-center gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-none">
              {avgRating.toFixed(1)}
            </span>
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          {reviews && reviews?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {visibleReviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    businessId={businessId}
                    currentUserId={currentUserId}
                    isSuperAdmin={isSuperAdmin}
                    canReply={canReply}
                    isReplyOpen={openReplyFor === review._id}
                    replyDraft={replyDrafts[review._id] || ""}
                    isReplying={isReplying}
                    commentExpanded={!!expandedComments[review._id]}
                    onReplyDraftChange={(v) =>
                      setReplyDrafts((d) => ({ ...d, [review._id]: v }))
                    }
                    onOpenReply={() => setOpenReplyFor(review._id)}
                    onCancelReply={() => setOpenReplyFor(null)}
                    onSubmitReply={() => submitReply(review._id)}
                    onEdit={() => {
                      form.setValue("comment", review.comment);
                      form.setValue("rating", review.rating);
                      form.setValue("review_id", review._id);
                    }}
                    onDelete={() => handleDelete(review._id)}
                    onExpandComment={() =>
                      setExpandedComments((d) => ({ ...d, [review._id]: true }))
                    }
                  />
                ))}
              </div>

              {hasMoreReviews && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    className="border border-slate-300 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                    onClick={() => setReviewsDrawerOpen(true)}>
                    {`See all ${reviews.length} reviews`}
                  </button>
                </div>
              )}
            </>
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

      <Drawer open={reviewsDrawerOpen} onOpenChange={setReviewsDrawerOpen}>
        <DrawerContent className="min-h-screen! fixed inset-x-0 bottom-0 top-0! mt-0! rounded-t-none border-none z-999">
          <div className="mx-auto w-full h-full flex flex-col">
            <DrawerHeader className="flex flex-row items-center justify-between border-b px-6">
              <DrawerTitle className="text-2xl">
                {reviews?.length ?? 0} reviews
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-5xl mx-auto">
                {(reviews ?? []).map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    businessId={businessId}
                    currentUserId={currentUserId}
                    isSuperAdmin={isSuperAdmin}
                    canReply={canReply}
                    isReplyOpen={openReplyFor === review._id}
                    replyDraft={replyDrafts[review._id] || ""}
                    isReplying={isReplying}
                    commentExpanded={!!expandedComments[review._id]}
                    onReplyDraftChange={(v) =>
                      setReplyDrafts((d) => ({ ...d, [review._id]: v }))
                    }
                    onOpenReply={() => setOpenReplyFor(review._id)}
                    onCancelReply={() => setOpenReplyFor(null)}
                    onSubmitReply={() => submitReply(review._id)}
                    onEdit={() => {
                      form.setValue("comment", review.comment);
                      form.setValue("rating", review.rating);
                      form.setValue("review_id", review._id);
                    }}
                    onDelete={() => handleDelete(review._id)}
                    onExpandComment={() =>
                      setExpandedComments((d) => ({ ...d, [review._id]: true }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
