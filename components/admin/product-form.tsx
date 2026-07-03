"use client";

import { useState } from "react";
import { MediaUpload } from "@/components/admin/media-upload";

type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  videoUrl: string | null;
  posterUrl: string | null;
  mediaType: "image" | "video";
  mediaFit: "cover" | "hybrid" | "contain" | "auto";
  affiliateUrl: string;
  shopName: string;
  deliveryTime: string | null;
  tags: string;
  viralScore: number;
  isActive: boolean;
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: ProductFormValues;
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
      />
    </label>
  );
}

// Controlled text input variant, used for the media URL fields that the
// MediaUpload widget also writes into.
function ControlledField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      {label}
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProductForm({ action, submitLabel, initial }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? "");
  const [mediaType, setMediaType] = useState<"image" | "video">(initial?.mediaType ?? "image");

  function handleUploaded(url: string, kind: "image" | "video") {
    if (kind === "video") {
      setVideoUrl(url);
      // A freshly uploaded video should become the slide's primary media.
      setMediaType("video");
    } else {
      setImageUrl(url);
    }
  }

  return (
    <form action={action} className="flex max-w-xl flex-col gap-3">
      <Field label="Name" name="name" defaultValue={initial?.name} required />

      <label className="flex flex-col gap-1 text-sm">
        Beschreibung
        <textarea
          name="description"
          defaultValue={initial?.description}
          required
          rows={3}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
        />
      </label>

      <div className="flex gap-3">
        <Field label="Preis (€)" name="price" type="number" defaultValue={initial?.price?.toString()} required />
        <Field label="Kategorie" name="category" defaultValue={initial?.category} required />
      </div>

      {/* Media upload widget — writes into the URL fields below. Manual URL
          entry remains as a fallback. */}
      <MediaUpload onUploaded={handleUploaded} imageUrl={imageUrl} videoUrl={videoUrl} />

      <ControlledField label="Bild-URL" name="imageUrl" value={imageUrl} onChange={setImageUrl} required />

      <div className="flex gap-3">
        <ControlledField
          label="Video-URL (optional)"
          name="videoUrl"
          value={videoUrl}
          onChange={setVideoUrl}
        />
        <ControlledField
          label="Poster-URL (optional)"
          name="posterUrl"
          value={posterUrl}
          onChange={setPosterUrl}
        />
      </div>

      <div className="flex gap-3">
        <Select
          label="Medientyp"
          name="mediaType"
          value={mediaType}
          onChange={(v) => setMediaType(v as "image" | "video")}
          options={["image", "video"]}
        />
        <MediaFitSelect defaultValue={initial?.mediaFit ?? "hybrid"} />
      </div>

      <Field label="Affiliate-URL" name="affiliateUrl" defaultValue={initial?.affiliateUrl} required />
      <Field label="Shopname" name="shopName" defaultValue={initial?.shopName} required />
      <Field
        label="Lieferzeit (optional)"
        name="deliveryTime"
        defaultValue={initial?.deliveryTime ?? ""}
        placeholder="z. B. 2-3 Werktage"
      />
      <Field label="Tags (kommagetrennt)" name="tags" defaultValue={initial?.tags ?? ""} />

      <div className="flex items-end gap-4">
        <Field
          label="ViralScore (0-100)"
          name="viralScore"
          type="number"
          defaultValue={(initial?.viralScore ?? 50).toString()}
        />
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          Aktiv
        </label>
      </div>

      <button type="submit" className="mt-2 rounded-xl bg-accent py-3 font-semibold text-white">
        {submitLabel}
      </button>
    </form>
  );
}

// Media-fit stays uncontrolled (upload never touches it), kept as its own
// component so the controlled Select signature isn't forced onto it.
function MediaFitSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Select
      label="Media-Fit"
      name="mediaFit"
      value={value}
      onChange={setValue}
      options={["cover", "hybrid", "contain", "auto"]}
    />
  );
}
