import { Schema, models, model } from "mongoose";

const EventSchema = new Schema({
  title: { type: String },
  description: { type: String },
  dateRange: {
    from: { type: Date },
    to: { type: Date },
  },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  location: { type: String },
  venue: { type: String },
  category: { type: String },
  image: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  ticket_link: { type: String },
  ticket_price: { type: Number },
  startTime: { type: String },
  endTime: { type: String },
  community: { type: String },
});

export const Event = models.Event || model("Event", EventSchema);

export default Event;

//   title: z.string().min(2, "Title is required"),
//   price: z.string().min(1, "Price is required"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   price_category: z.string().min(2, "Price category is required"),
//   image: z.any().refine((file) => file instanceof File, "Image is required"),
//   venue: z.string().min(2, "Venue is required"),
//   category: z.string().min(2, "Category is required"),
//   date: z.string().min(1, "Date is required"),
//   latitude: z.number().min(-90).max(90),
//   longitude: z.number().min(-180).max(180),
//   location: z.string().min(2, "Location is required"),
//   ticket_link: z.string().optional(),
//   ticket_price: z.string().optional(),
