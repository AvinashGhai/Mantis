import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import GarageItem from "@/models/GarageItem";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    console.log("--- API START: Adding to Garage ---");
    await connectToDatabase();
    
    // Get logged-in user email from session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("user_session");
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid session cookie." }, { status: 400 });
    }

    const user = await User.findOne({ email: sessionData.email });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 401 });
    }

    const data = await req.json();
    console.log("Received Data:", data);

    // Save garage item with the logged-in user's actual MongoDB ObjectId
    const newItem = await GarageItem.create({
      userId: user._id,
      productName: data.name, // Mapped from 'name'
      brand: data.brand,
      category: data.category,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
      usageReading: Number(data.usage),
      status: "optimal",
      healthScore: 100,
      productId: data.productId,
      iconName: data.iconName
    });

    console.log("✅ Successfully saved to MongoDB:", newItem._id);
    return NextResponse.json({ success: true, item: newItem }, { status: 201 });

  } catch (error: any) {
    console.error("❌ MONGODB ERROR:", error.message);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}