import { Schema, models, model } from "mongoose";

const FavoriteSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    item_id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "item_type",
    },
    item_type: {
      type: String,
      enum: ["Event", "Service", "Deal"],
      required: true,
    },
  },
  { timestamps: true },
);

FavoriteSchema.index({ user_id: 1, item_id: 1 }, { unique: true });

const Favorite = models.Favorite || model("Favorite", FavoriteSchema);

export default Favorite;
