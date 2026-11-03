import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function getFallbackAvatar(name: string): string {
  if (!name) return "HH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Automatically upgrades image URLs to 2K/4K high-resolution
 * - Unsplash: replaces low-res width/quality with 2K/4K (w=2560&q=95)
 * - Google / Blogspot / lh3: upgrades downsampled flags (=w400, =s320) to full resolution (=s2560)
 * - Imgur: strips thumbnail suffixes (m/l/s/t) to fetch full-resolution master
 * - WordPress: removes downscaled dimension suffixes (e.g. -300x200.jpg -> .jpg)
 */
export function getHighResImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const clean = url.trim();

  try {
    // 1. Unsplash images: upgrade to 2K (w=2560, q=95, high-DPI)
    if (clean.includes("images.unsplash.com")) {
      const parsed = new URL(clean);
      parsed.searchParams.set("w", "2560");
      parsed.searchParams.set("q", "95");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }

    // 2. Google User Content / Blogspot / Photos (e.g. =w500, =s400, etc.)
    if (
      clean.includes("googleusercontent.com") ||
      clean.includes("ggpht.com") ||
      clean.includes("bp.blogspot.com")
    ) {
      return clean.replace(/=s\d+(-c)?/i, "=s2560").replace(/=w\d+(-h\d+)?/i, "=w2560");
    }

    // 3. Pexels images: upgrade to 2K/4K (w=2560, dpr=2)
    if (clean.includes("images.pexels.com")) {
      const parsed = new URL(clean);
      parsed.searchParams.set("w", "2560");
      parsed.searchParams.set("dpr", "2");
      parsed.searchParams.set("auto", "compress");
      parsed.searchParams.set("cs", "tinysrgb");
      return parsed.toString();
    }

    // 4. Cloudinary images: upgrade to w_2560,q_auto:best
    if (clean.includes("res.cloudinary.com") && clean.includes("/upload/")) {
      return clean.replace(/\/upload\/(?:[a-zA-Z0-9_,]+)?\//, "/upload/w_2560,q_auto:best,f_auto/");
    }

    // 5. Imgur thumbnails (e.g. abcd123m.jpg -> abcd123.jpg)
    if (clean.includes("i.imgur.com")) {
      return clean.replace(/([a-zA-Z0-9]{5,})(s|m|l|t|h)(\.(jpg|jpeg|png|webp))/i, "$1$3");
    }

    // 6. Wikimedia thumbnails (strip /thumb/ and the scaled filename suffix)
    if (clean.includes("upload.wikimedia.org") && clean.includes("/thumb/")) {
      const unthumb = clean.replace("/thumb/", "/");
      const lastSlash = unthumb.lastIndexOf("/");
      if (lastSlash > 0) {
        return unthumb.substring(0, lastSlash);
      }
    }

    // 7. WordPress downscaled sizes (e.g. photo-300x200.jpg -> photo.jpg)
    if (/-\d{2,4}x\d{2,4}\.(jpe?g|png|webp)$/i.test(clean)) {
      return clean.replace(/-\d{2,4}x\d{2,4}\.(jpe?g|png|webp)$/i, ".$1");
    }
  } catch {
    // Return clean URL if parsing fails
  }

  return clean;
}
