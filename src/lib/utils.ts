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
  const trimmed = name.trim();
  const clean = trimmed.includes("@") ? trimmed.split("@")[0]! : trimmed;
  const parts = clean.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "HH";
  if (parts.length === 1) {
    // Single word e.g. "shihab" -> "S"
    return parts[0]![0]!.toUpperCase();
  }
  // Multiple words e.g. "ahnaf abir" -> "AA", "ahnaf shahriar abir" -> "AS" (initials of first two words)
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** Capitalizes the first letter of a string while preserving the rest */
export function capitalizeFirst(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Formats numbers compactly across all features:
 * - Below 100: exact number (0, 1, 99)
 * - 100 to 999: rounded down to hundreds with a plus (100+, 200+, 300+, 900+)
 * - 1,000+: compact notation (1K, 2K, 1.5K, 10K, 1M, 10M, 1B)
 */
export function formatCompactNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === "") return "0";
  const parsed = typeof num === "string" ? Number(num) : num;
  if (isNaN(parsed)) return String(num);
  if (parsed < 0) return "0";
  if (parsed < 100) return parsed.toLocaleString("en-US");
  if (parsed < 1000) {
    const hundreds = Math.floor(parsed / 100) * 100;
    return `${hundreds}+`;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(parsed);
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
    // 0. Handle device-uploaded images: normalize localhost/remote host to same-origin /api/upload/image/:id
    if (clean.includes("/api/upload/image/")) {
      const match = clean.match(/\/api\/upload\/image\/([a-fA-F0-9]{24})/);
      if (match && match[1]) {
        return `/api/upload/image/${match[1]}`;
      }
    }

    // 1. Unsplash images: upgrade to 4K UHD (w=3840, q=100) and remove forced crop
    if (clean.includes("images.unsplash.com")) {
      const parsed = new URL(clean);
      parsed.searchParams.set("w", "3840");
      parsed.searchParams.set("q", "100");
      parsed.searchParams.set("auto", "format");
      // Prevent Unsplash from artificially cropping the original photo
      if (parsed.searchParams.get("fit") === "crop") {
        parsed.searchParams.set("fit", "max");
      }
      return parsed.toString();
    }

    // 2. Google User Content / Blogspot / Photos (upgrade to 4K =s3840 / =w3840)
    if (
      clean.includes("googleusercontent.com") ||
      clean.includes("ggpht.com") ||
      clean.includes("bp.blogspot.com")
    ) {
      return clean.replace(/=s\d+(-c)?/i, "=s3840").replace(/=w\d+(-h\d+)?/i, "=w3840");
    }

    // 3. Pexels images: upgrade to 4K UHD (w=3840, dpr=2)
    if (clean.includes("images.pexels.com")) {
      const parsed = new URL(clean);
      parsed.searchParams.set("w", "3840");
      parsed.searchParams.set("dpr", "2");
      parsed.searchParams.set("auto", "compress");
      parsed.searchParams.set("cs", "tinysrgb");
      return parsed.toString();
    }

    // 4. Cloudinary images: upgrade to w_3840,q_auto:best
    if (clean.includes("res.cloudinary.com") && clean.includes("/upload/")) {
      return clean.replace(/\/upload\/(?:[a-zA-Z0-9_,]+)?\//, "/upload/w_3840,q_auto:best,f_auto/");
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

/**
 * Client-side canvas image compression to keep upload payloads lightweight & fast
 */
export function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(event.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Formats a Bangladesh phone number as the user types:
 * e.g. +880 1 603 - 759 643
 */
export function formatPhoneNumberInput(raw: string): string {
  if (!raw) return "+880 ";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  if (digits.length === 0) {
    return "+880 ";
  }
  if (digits.length === 1) {
    return `+880 ${digits}`;
  }
  if (digits.length <= 4) {
    return `+880 ${digits[0]} ${digits.slice(1)}`;
  }
  if (digits.length <= 7) {
    return `+880 ${digits[0]} ${digits.slice(1, 4)} - ${digits.slice(4)}`;
  }
  return `+880 ${digits[0]} ${digits.slice(1, 4)} - ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

/**
 * Formats a phone number for display on event card / event details:
 * e.g. (+8801603-759643)
 */
export function formatPhoneNumberDisplay(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return `+880${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone.trim();
}
