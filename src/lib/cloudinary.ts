import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Upload a file buffer to Cloudinary with automatic compression
 * - Photos: max 1920px, auto quality, auto format (WebP), ~90% size reduction
 * - Avatars: max 400px, auto quality, auto format
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  mimetype: string,
  options?: { isAvatar?: boolean }
): Promise<{ url: string; publicId: string }> {
  const resourceType = mimetype.startsWith("image/") ? "image" : "raw";
  const isAvatar = options?.isAvatar ?? false;

  const result = await new Promise<{ url: string; public_id: string }>(
    (resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder,
        public_id: filename.replace(/\.[^.]+$/, ""), // remove extension
        resource_type: resourceType,
        overwrite: true,
        unique_filename: true,
      };

      // Apply automatic compression for images
      if (resourceType === "image") {
        if (isAvatar) {
          // Avatar: small size, high quality
          uploadOptions.transformation = [
            { width: 400, height: 400, crop: "limit" },
            { quality: "auto:good", fetch_format: "auto" },
          ];
        } else {
          // Photos: max 1920px, auto quality for best compression
          uploadOptions.transformation = [
            { width: 1920, height: 1920, crop: "limit" },
            { quality: "auto:eco", fetch_format: "auto" },
          ];
        }
        // Use eager to generate compressed version immediately
        uploadOptions.eager = [
          {
            width: 400,
            height: 400,
            crop: "fill",
            quality: "auto:good",
            fetch_format: "auto",
          },
        ];
        uploadOptions.eager_async = false;
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        })
        .end(buffer);
    }
  );

  return {
    url: result.url,
    publicId: result.public_id,
  };
}

/**
 * Get optimized URL for displaying images
 * - thumbnail: 400px wide, fill crop
 * - medium: 800px wide, limit
 * - full: original compressed version
 */
export function getOptimizedUrl(
  publicIdOrUrl: string,
  size: "thumbnail" | "medium" | "full" = "full"
): string {
  // If it's already a Cloudinary URL, extract public_id
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.startsWith("http")) {
    try {
      const url = new URL(publicIdOrUrl);
      const pathParts = url.pathname.split("/");
      const uploadIndex = pathParts.findIndex((p) => p === "upload");
      if (uploadIndex >= 0) {
        // Remove everything up to and including "upload" and version
        const afterUpload = pathParts.slice(uploadIndex + 1);
        const firstNonVersion = afterUpload.findIndex(
          (p) => !/^v\d+$/.test(p)
        );
        if (firstNonVersion >= 0) {
          publicId = afterUpload.slice(firstNonVersion).join("/").replace(/\.[^.]+$/, "");
        }
      }
    } catch {
      // If URL parsing fails, return original
      return publicIdOrUrl;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return publicIdOrUrl;

  switch (size) {
    case "thumbnail":
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill,q_auto:good,f_auto/${publicId}`;
    case "medium":
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_800,c_limit,q_auto:good,f_auto/${publicId}`;
    case "full":
      return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto:eco,f_auto/${publicId}`;
  }
}

/**
 * Delete a file from Cloudinary by URL or publicId
 */
export async function deleteFromCloudinary(
  identifier: string
): Promise<boolean> {
  try {
    let publicId = identifier;

    // If it's a URL, extract the public_id
    if (identifier.startsWith("http")) {
      const url = new URL(identifier);
      const pathParts = url.pathname.split("/");
      // Remove version segment (e.g., v1234567890)
      const versionIndex = pathParts.findIndex((p) => /^v\d+$/.test(p));
      if (versionIndex >= 0) {
        pathParts.splice(0, versionIndex + 1);
      }
      // Remove extension
      const lastPart = pathParts[pathParts.length - 1];
      pathParts[pathParts.length - 1] = lastPart.replace(/\.[^.]+$/, "");
      publicId = pathParts.join("/");
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch {
    return false;
  }
}
