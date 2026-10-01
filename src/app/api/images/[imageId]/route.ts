import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

interface StoredImageBytes {
  mimeType: string;
  body: ArrayBuffer;
}

const imageCache = new Map<string, StoredImageBytes>();

interface ImageRouteProps {
  params: {
    imageId: string;
  };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

function imageResponse(image: StoredImageBytes) {
  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(_request: Request, { params }: ImageRouteProps) {
  const cached = imageCache.get(params.imageId);
  if (cached) {
    return imageResponse(cached);
  }

  const image = await prisma.storedImage.findUnique({
    where: { id: params.imageId },
  });

  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stored = {
    mimeType: image.mimeType,
    body: toArrayBuffer(new Uint8Array(image.data)),
  };
  imageCache.set(params.imageId, stored);

  return imageResponse(stored);
}
