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
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  mimetype: string
): Promise<{ url: string; publicId: string }> {
  const resourceType = mimetype.startsWith("image/") ? "image" : "raw";

  const result = await new Promise<{ url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: filename.replace(/\.[^.]+$/, ""), // remove extension, Cloudinary adds it
            resource_type: resourceType,
            overwrite: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        )
        .end(buffer);
    }
  );

  return {
    url: result.url,
    publicId: result.public_id,
  };
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
