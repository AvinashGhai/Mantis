import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json({ success: false, error: "No pending verification code found" }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ success: false, error: "Verification code has expired. Please request a new code by logging in again." }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    console.log(`👤 User logged in successfully: ${email} (${user.role})`);

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 200 });

    const cookieStore = await cookies();
    cookieStore.set("user_session", JSON.stringify({ email: user.email, role: user.role }), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error: any) {
    console.error("❌ Verify Login API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
