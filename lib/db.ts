import mongoose from "mongoose";

export const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
