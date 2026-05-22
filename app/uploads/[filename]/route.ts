import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    const params = await context.params;
    const filename = params.filename;

    if (!filename) {
      return new NextResponse("Filename is required", { status: 400 });
    }

    const filePath = join(process.cwd(), "public", "uploads", filename);

    // Security check: ensure path is within the uploads directory to prevent directory traversal
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on extension
    let contentType = "application/octet-stream";
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension === "png") {
      contentType = "image/png";
    } else if (extension === "jpg" || extension === "jpeg") {
      contentType = "image/jpeg";
    } else if (extension === "gif") {
      contentType = "image/gif";
    } else if (extension === "webp") {
      contentType = "image/webp";
    } else if (extension === "webm") {
      contentType = "audio/webm";
    } else if (extension === "mp3") {
      contentType = "audio/mpeg";
    } else if (extension === "wav") {
      contentType = "audio/wav";
    } else if (extension === "ogg") {
      contentType = "audio/ogg";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
