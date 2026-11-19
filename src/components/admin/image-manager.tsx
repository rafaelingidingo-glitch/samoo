"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import {
  GripVertical,
  Star,
  UploadCloud,
  Loader2,
  X,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { optimizedImageUrl } from "@/lib/cloudinary/image-url";

const MAX_IMAGES = 10;
const MAX_FILE_MB = 8;

export type FormImage = {
  imageUrl: string;
  publicId: string | null;
  altText: string;
};

type ImageManagerProps = {
  images: FormImage[];
  onChange: (images: FormImage[]) => void;
};

function SortableImage({
  image,
  index,
  total,
  onSetPrimary,
  onRemove,
  onAltChange,
}: {
  image: FormImage;
  index: number;
  total: number;
  onSetPrimary: () => void;
  onRemove: () => void;
  onAltChange: (alt: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.imageUrl });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const isPrimary = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-2 transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-gold" : "border-border"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-secondary">
        <Image
          src={optimizedImageUrl(image.imageUrl, 480)}
          alt={image.altText || `Vehicle photo ${index + 1}`}
          fill
          sizes="200px"
          className="object-cover"
        />
        {isPrimary && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-foreground">
            <Star className="h-3 w-3" aria-hidden />
            Main
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove photo ${index + 1}`}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-90 transition hover:bg-red-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder photo ${index + 1}`}
          className="cursor-grab rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing disabled:opacity-40"
          disabled={total <= 1}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onSetPrimary}
          disabled={isPrimary}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          <Star className={`h-3.5 w-3.5 ${isPrimary ? "text-gold" : ""}`} aria-hidden />
          {isPrimary ? "Main photo" : "Set as main"}
        </button>
      </div>

      <Input
        value={image.altText}
        onChange={(e) => onAltChange(e.target.value)}
        placeholder="Alt text (accessibility)"
        className="mt-1.5 h-8 text-xs"
        aria-label={`Alt text for photo ${index + 1}`}
        maxLength={280}
      />
    </div>
  );
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [uploading, setUploading] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      setUploadError(null);

      if (images.length + list.length > MAX_IMAGES) {
        setUploadError(`Maximum ${MAX_IMAGES} images per vehicle.`);
        return;
      }
      const invalid = list.find(
        (f) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(f.type)
      );
      if (invalid) {
        setUploadError(`"${invalid.name}" is not a supported image (JPEG, PNG, WebP, AVIF).`);
        return;
      }
      const tooBig = list.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
      if (tooBig) {
        setUploadError(`"${tooBig.name}" exceeds the ${MAX_FILE_MB} MB limit.`);
        return;
      }

      setUploading(list.length);
      try {
        const form = new FormData();
        for (const file of list) form.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data?.error?.message || "Upload failed. Please retry.");
          return;
        }
        const uploaded: FormImage[] = (data.images || []).map((i: { imageUrl: string; publicId: string | null; altText: string }) => ({
          imageUrl: i.imageUrl,
          publicId: i.publicId,
          altText: i.altText || "",
        }));
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded.`);
      } catch {
        setUploadError("Network error during upload. Please retry.");
      } finally {
        setUploading(0);
      }
    },
    [images, onChange]
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.imageUrl === active.id);
    const newIndex = images.findIndex((i) => i.imageUrl === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(images, oldIndex, newIndex));
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setPrimary(index: number) {
    if (index === 0) return;
    onChange([images[index], ...images.filter((_, i) => i !== index)]);
  }

  function updateAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, altText: alt } : img)));
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragActive ? "border-gold bg-gold/5" : "border-border bg-secondary/40"
        }`}
      >
        {uploading > 0 ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-gold-dark" aria-hidden />
            <p className="mt-3 text-sm font-medium">Uploading {uploading} photo{uploading === 1 ? "" : "s"}…</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground/60" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              Drag &amp; drop photos here, or
            </p>
            <label className="mt-2">
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink/85">
                <UploadCloud className="h-4 w-4" aria-hidden />
                Browse files
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="mt-3 text-xs text-muted-foreground">
              JPEG, PNG, WebP or AVIF · up to {MAX_FILE_MB} MB each · {images.length}/{MAX_IMAGES} photos
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {uploadError}
        </p>
      )}

      {/* Sortable grid */}
      {images.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.imageUrl)} strategy={rectSortingStrategy}>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <SortableImage
                  key={image.imageUrl}
                  image={image}
                  index={index}
                  total={images.length}
                  onSetPrimary={() => setPrimary(index)}
                  onRemove={() => removeAt(index)}
                  onAltChange={(alt) => updateAlt(index, alt)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
          Drag to reorder · the first photo is the main image shown in listings.
        </p>
      )}
    </div>
  );
}
