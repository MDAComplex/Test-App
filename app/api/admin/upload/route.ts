import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";

// Client-upload token endpoint for admin media (images + videos).
//
// The browser uploads the file DIRECTLY to Vercel Blob storage, which
// bypasses the ~4.5MB serverless request-body limit (videos would blow past
// it otherwise). This route only issues a short-lived, scoped upload token —
// the file bytes never pass through here.
//
// Security gate: `onBeforeGenerateToken` runs `auth()` and throws unless the
// caller is an ADMIN, so no non-admin can ever obtain an upload token even
// though the browser drives the upload.
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // ~100MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
          throw new Error("Nicht autorisiert");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client writes the returned blob URL into the product form.
        // (This callback only fires with a publicly reachable webhook URL, so
        // we intentionally don't rely on it for local dev.)
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload fehlgeschlagen" },
      { status: 400 },
    );
  }
}
