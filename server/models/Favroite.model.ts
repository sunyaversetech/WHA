import { Schema, models, model } from "mongoose";

const FavoriteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  event: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  service: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  deal: [{ type: Schema.Types.ObjectId, ref: "Deal" }],
});

const Favorite = models.Favorite || model("Favorite", FavoriteSchema);

export default Favorite;
