"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type MediaKind = "image" | "video";

type MediaUploadProps = {
  // Called with the resulting public blob URL after a successful upload.
  // `kind` lets the parent route the URL into imageUrl vs videoUrl and switch
  // mediaType accordingly.
  onUploaded: (url: string, kind: MediaKind) => void;
  // Current URLs so the widget can show a preview even for manually entered
  // (fallback) URLs, and remember the last uploaded media.
  imageUrl?: string;
  videoUrl?: string | null;
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

export function MediaUpload({ onUploaded, imageUrl, videoUrl }: MediaUploadProps) {
  const [kind, setKind] = useState<MediaKind>("image");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewImage = uploadedUrl && kind === "image" ? uploadedUrl : imageUrl || null;
  const previewVideo = uploadedUrl && kind === "video" ? uploadedUrl : videoUrl || null;

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        onUploadProgress: (event) => setProgress(Math.round(event.percentage)),
      });
      setUploadedUrl(result.url);
      onUploaded(result.url, kind);
      setProgress(null);
    } catch {
      setError("Hochladen fehlgeschlagen");
      setProgress(null);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset so selecting the same file again re-triggers change.
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const isUploading = progress !== null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setKind("image")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            kind === "image" ? "bg-accent text-white" : "bg-zinc-800 text-zinc-300"
          }`}
        >
          Bild hochladen
        </button>
        <button
          type="button"
          onClick={() => setKind("video")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            kind === "video" ? "bg-accent text-white" : "bg-zinc-800 text-zinc-300"
          }`}
        >
          Video hochladen
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={kind === "image" ? IMAGE_ACCEPT : VIDEO_ACCEPT}
        onChange={onInputChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={isUploading}
        className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
          dragOver ? "border-accent bg-accent/10 text-white" : "border-zinc-700 text-zinc-400"
        } ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer hover:border-accent"}`}
      >
        {isUploading ? (
          <>
            <span>Wird hochgeladen… {progress} %</span>
            <span className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
              <span
                className="block h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </span>
          </>
        ) : (
          <span>Datei auswählen oder hierher ziehen</span>
        )}
      </button>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      {(previewImage || previewVideo) && (
        <div className="mt-1 overflow-hidden rounded-lg border border-zinc-800 bg-black">
          {previewVideo ? (
            <video
              src={previewVideo}
              poster={previewImage ?? undefined}
              muted
              loop
              playsInline
              controls
              className="max-h-48 w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage!} alt="Vorschau" className="max-h-48 w-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
