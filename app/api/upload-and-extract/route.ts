import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/r2";
import { extractEventInfo } from "@/lib/gemini";
import { randomUUID } from "crypto";
import mammoth from "mammoth";

const BINARY_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TEXT_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
};

const ALL_SUPPORTED = { ...BINARY_TYPES, ...TEXT_TYPES };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // browsers sometimes report .md as text/plain — detect by extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = ext === "md" ? "text/markdown" : file.type;

  if (!ALL_SUPPORTED[mimeType]) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, image, Word document (.docx), or text file (.txt / .md)." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `documents/${user.id}/${randomUUID()}.${ext}`;

  try {
    // Extract text for non-binary formats before hitting R2 (parallel is fine for binary)
    let extractInput: Parameters<typeof extractEventInfo>[0];

    if (TEXT_TYPES[mimeType]) {
      const text =
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? (await mammoth.extractRawText({ buffer })).value
          : buffer.toString("utf-8");
      extractInput = { text };
    } else {
      extractInput = { buffer, mimeType };
    }

    const [url, extracted] = await Promise.all([
      uploadToR2(buffer, key, mimeType),
      extractEventInfo(extractInput),
    ]);

    return NextResponse.json({ url, filename: file.name, mimeType, size: file.size, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload or extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
