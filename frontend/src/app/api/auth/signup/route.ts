import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { name, email, password, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (role !== "customer" && role !== "company") {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 400 });
      } else {
        // Overwrite unverified user and set as verified
        existingUser.name = name;
        existingUser.password = hashPassword(password);
        existingUser.role = role;
        existingUser.isVerified = true;
        existingUser.otp = null;
        existingUser.otpExpiry = null;

        await existingUser.save();

        const response = NextResponse.json({
          success: true,
          message: "Account created successfully",
          user: {
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        }, { status: 200 });

        const cookieStore = await cookies();
        cookieStore.set("user_session", JSON.stringify({ email: existingUser.email, role: existingUser.role }), {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
      }
    }

    // Create new verified user directly
    const user = await User.create({
      name,
      email,
      password: hashPassword(password),
      role,
      isVerified: true
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
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
    console.error("❌ Signup API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
