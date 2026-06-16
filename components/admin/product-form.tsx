"use client";

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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
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

      <Field label="Bild-URL" name="imageUrl" defaultValue={initial?.imageUrl} required />

      <div className="flex gap-3">
        <Field label="Video-URL (optional)" name="videoUrl" defaultValue={initial?.videoUrl ?? ""} />
        <Field label="Poster-URL (optional)" name="posterUrl" defaultValue={initial?.posterUrl ?? ""} />
      </div>

      <div className="flex gap-3">
        <Select label="Medientyp" name="mediaType" defaultValue={initial?.mediaType ?? "image"} options={["image", "video"]} />
        <Select
          label="Media-Fit"
          name="mediaFit"
          defaultValue={initial?.mediaFit ?? "hybrid"}
          options={["cover", "hybrid", "contain", "auto"]}
        />
      </div>

      <Field label="Affiliate-URL" name="affiliateUrl" defaultValue={initial?.affiliateUrl} required />
      <Field label="Shopname" name="shopName" defaultValue={initial?.shopName} required />
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
