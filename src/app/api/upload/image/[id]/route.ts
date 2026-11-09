import { ObjectId } from "mongodb";
import { getClientDb } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return new Response("Invalid image ID", { status: 400 });
    }

    const db = getClientDb();
    const doc = await db
      .collection("uploaded_images")
      .findOne({ _id: new ObjectId(id) });

    if (!doc || !doc.data) {
      return new Response("Image not found", { status: 404 });
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(doc.data)) {
      buffer = doc.data;
    } else if ((doc.data as any)?.buffer) {
      buffer = Buffer.from((doc.data as any).buffer);
    } else {
      buffer = Buffer.from(doc.data as any);
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": doc.contentType || "image/jpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
