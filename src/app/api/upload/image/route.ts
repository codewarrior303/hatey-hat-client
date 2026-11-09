import { NextResponse } from "next/server";
import { getClientDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, contentType = "image/jpeg", name } = body || {};

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid or missing image payload" },
        { status: 400 }
      );
    }

    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "Uploaded image is empty" },
        { status: 400 }
      );
    }

    if (buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Image file exceeds 8MB limit" },
        { status: 400 }
      );
    }

    const db = getClientDb();
    const result = await db.collection("uploaded_images").insertOne({
      contentType: String(contentType).slice(0, 50),
      data: buffer,
      size: buffer.length,
      name: typeof name === "string" ? name.slice(0, 100) : undefined,
      createdAt: new Date(),
    });

    const url = `/api/upload/image/${result.insertedId}`;

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        data: {
          url,
          id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error uploading image" },
      { status: 500 }
    );
  }
}
