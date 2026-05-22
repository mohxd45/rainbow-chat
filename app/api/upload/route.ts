import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create the public/uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename to avoid overwrites
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name || "file";
    
    // Safely get file extension
    let extension = "bin";
    const parts = originalName.split(".");
    if (parts.length > 1) {
      extension = parts.pop() || "bin";
    }
    
    const filename = `${uniqueSuffix}.${extension}`;
    const filePath = join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return the relative URL of the uploaded asset
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Local file upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
