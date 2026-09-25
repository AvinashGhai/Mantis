import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import GarageItem from "@/models/GarageItem";
import User from "@/models/User";

export async function GET() {
  try {
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

    const items = await GarageItem.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      items: items 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ FETCH ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch garage items" 
    }, { status: 500 });
  }
}