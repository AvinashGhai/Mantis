import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/models/Product";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const productId = data.product_id;
    const creatorEmail = data.creatorEmail;

    if (!productId || !creatorEmail) {
      return NextResponse.json({ success: false, error: "Product ID and Creator Email are required" }, { status: 400 });
    }

    // Check if the product ID is already registered under a different company/user
    const existingProduct = await Product.findOne({ productId });

    if (existingProduct) {
      if (existingProduct.creatorEmail !== creatorEmail) {
        return NextResponse.json({
          success: false,
          error: `This Product ID (${productId}) is owned by another manufacturer (${existingProduct.creatorEmail}).`
        }, { status: 403 });
      }

      // Overwrite/Update existing product owned by the same company
      existingProduct.name = data.name;
      existingProduct.brand = data.brand || "Mantis";
      existingProduct.category = data.category;
      existingProduct.icon = data.icon || (data.category === "EV / Scooter" ? "Bike" : data.category === "Appliance" ? "Wind" : "Cpu");
      existingProduct.trainingUrl = data.source_url;
      await existingProduct.save();

      return NextResponse.json({ success: true, product: existingProduct, updated: true });
    }

    // Register brand-new product
    const newProduct = await Product.create({
      name: data.name,
      brand: data.brand || "Mantis",
      category: data.category,
      icon: data.icon || (data.category === "EV / Scooter" ? "Bike" : data.category === "Appliance" ? "Wind" : "Cpu"),
      trainingUrl: data.source_url,
      productId: productId,
      creatorEmail: creatorEmail,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}