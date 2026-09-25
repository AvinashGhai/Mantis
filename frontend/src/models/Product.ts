import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: "Cpu" }, // Store string name of lucide icon
  trainingUrl: { type: String }, // The S3 path
  isTrained: { type: Boolean, default: true },
  productId: { type: String, required: true }, // The custom product ID (e.g. "ac")
  creatorEmail: { type: String, required: true }, // Manufacturer creator email
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);