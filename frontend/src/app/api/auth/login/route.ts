import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, error: "Email, password and role are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 400 });
    }

    if (user.role !== role) {
      return NextResponse.json({ success: false, error: `Unauthorized role access. You are registered as a ${user.role}.` }, { status: 403 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ success: false, error: "This email is not verified yet. Please sign up again to verify." }, { status: 400 });
    }

    const passwordMatch = verifyPassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 400 });
    }

    // Set the session cookie and return login success
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

    console.log(`👤 User logged in successfully: ${email} (${user.role})`);

    return response;

  } catch (error: any) {
    console.error("❌ Login API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
