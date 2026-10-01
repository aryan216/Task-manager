import "server-only";

import { z } from "zod";

import { ServiceError } from "@/lib/service-error";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_FOLDER = "/jeera";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const uploadResponseSchema = z.object({
  url: z.string().url(),
});

const uploadErrorSchema = z.object({
  message: z.string().optional(),
});

export async function resolveImage(
  image: File | string | undefined
): Promise<string | null> {
  if (image instanceof File) {
    return saveUploadedImage(image);
  }

  if (typeof image === "string" && image.length > 0) {
    return image;
  }

  return null;
}

function imageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "");

  if (!privateKey || !urlEndpoint) {
    throw new ServiceError("Image storage is not configured", 500);
  }

  return { privateKey, urlEndpoint };
}

async function saveUploadedImage(file: File): Promise<string> {
  if (file.size === 0) {
    throw new ServiceError("Image file is empty", 400);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ServiceError("Image size should be less than 5MB", 400);
  }

  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    throw new ServiceError("Image must be a PNG, JPEG, WEBP, or GIF", 400);
  }

  const { privateKey, urlEndpoint } = imageKitConfig();
  const bytes = Buffer.from(await file.arrayBuffer());
  const body = new FormData();
  body.append("file", `data:${file.type};base64,${bytes.toString("base64")}`);
  body.append("fileName", `image.${extension}`);
  body.append("folder", IMAGEKIT_FOLDER);
  body.append("useUniqueFileName", "true");

  let response: Response;
  try {
    response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
      },
      body,
    });
  } catch {
    throw new ServiceError("Could not upload image", 502);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = uploadErrorSchema.safeParse(payload);
    throw new ServiceError(
      parsedError.success && parsedError.data.message
        ? parsedError.data.message
        : "Could not upload image",
      502
    );
  }

  const parsed = uploadResponseSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.url.startsWith(`${urlEndpoint}/`)) {
    throw new ServiceError("Could not upload image", 502);
  }

  return parsed.data.url;
}
