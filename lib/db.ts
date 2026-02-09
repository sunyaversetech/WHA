import mongoose from "mongoose";

export const connectToDb = async () => {
  console.log(process.env.MONGODB_URL);
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
