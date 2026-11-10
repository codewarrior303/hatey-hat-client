import { NextResponse } from "next/server";
import { getClientDb } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";
import {
  forgotPasswordEmailSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth.validator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, newPassword, confirmPassword } = body || {};

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid action specified." },
        { status: 400 }
      );
    }

    const db = getClientDb();

    // 1. VERIFY EMAIL STEP
    if (action === "verify-email") {
      const emailValidation = forgotPasswordEmailSchema.safeParse({ email });
      if (!emailValidation.success) {
        const errorMsg =
          emailValidation.error.issues[0]?.message ||
          "Please enter a valid email address.";
        return NextResponse.json(
          { success: false, message: errorMsg },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await db
        .collection("user")
        .findOne({ email: normalizedEmail });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No account found with this email address. Please register first.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Email verified. You can now set a new password.",
        email: normalizedEmail,
      });
    }

    // 2. RESET PASSWORD STEP
    if (action === "reset-password") {
      const emailValidation = forgotPasswordEmailSchema.safeParse({ email });
      if (!emailValidation.success) {
        return NextResponse.json(
          {
            success: false,
            message: "A valid email address is required to reset password.",
          },
          { status: 400 }
        );
      }

      const passwordValidation = resetPasswordSchema.safeParse({
        newPassword,
        confirmPassword,
      });

      if (!passwordValidation.success) {
        const errorMsg =
          passwordValidation.error.issues[0]?.message ||
          "Password does not satisfy requirements or passwords do not match.";
        return NextResponse.json(
          { success: false, message: errorMsg },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db
        .collection("user")
        .findOne({ email: normalizedEmail });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No account found with this email address. Please register first.",
          },
          { status: 404 }
        );
      }

      // Hash password using Better-Auth's standard crypto algorithm
      const hashedPassword = await hashPassword(newPassword);

      // Update or create credential account for this user
      const userFilter = [
        { userId: user._id },
        { userId: String(user._id) },
        ...(user.id ? [{ userId: user.id }] : []),
      ];

      const updateResult = await db.collection("account").updateOne(
        {
          providerId: "credential",
          $or: userFilter,
        },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

      // If user had no credential record (e.g. only OAuth previously), insert one
      if (updateResult.matchedCount === 0) {
        await db.collection("account").insertOne({
          userId: user._id,
          accountId: user._id,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Invalidate active sessions to enforce fresh login with the new credentials
      try {
        await db.collection("session").deleteMany({
          $or: userFilter,
        });
      } catch {
        // Continue even if session cleanup encounters transient issues
      }

      return NextResponse.json({
        success: true,
        message:
          "Your password has been changed successfully. You can now sign in with your new password.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported action." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to process request. Please try again later.",
      },
      { status: 500 }
    );
  }
}
