import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  business_id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    business_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a business"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating between 1 and 5"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Please add a comment"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

ReviewSchema.index({ business_id: 1, user: 1 }, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function (businessId) {
  const stats = await this.aggregate([
    { $match: { business_id: businessId } },
    {
      $group: {
        _id: "$business_id",
        avg_rating: { $avg: "$rating" },
        total_reviews: { $sum: 1 },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model("Business").findByIdAndUpdate(businessId, {
        average_rating: Math.round(stats[0].avg_rating * 10) / 10,
        review_count: stats[0].total_reviews,
      });
    } else {
      await mongoose.model("Business").findByIdAndUpdate(businessId, {
        average_rating: 0,
        review_count: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

ReviewSchema.post("save", function () {
  (this.constructor as any).calculateAverageRating(this.business_id);
});

ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.business_id);
  }
});

export const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
