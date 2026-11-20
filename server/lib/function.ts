import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  followRegionRedirects: true,
});

const MAX_IMAGE_WIDTH = 1600;

export const uploadToS3 = async (
  buffer: Buffer,
  fileName: string,
  mimetype: string,
) => {
  try {
    // Re-encode to WebP (capped at 1600px wide) before upload — large
    // source PNGs/JPEGs from phone cameras were the main cause of slow
    // cold-cache /_next/image optimizer requests. Non-image uploads (if
    // this is ever called with one) pass through untouched.
    let outBuffer = buffer;
    let outMimetype = mimetype;
    let extension = mimetype.split("/")[1] || "png";
    if (mimetype.startsWith("image/") && mimetype !== "image/svg+xml") {
      outBuffer = await sharp(buffer)
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      outMimetype = "image/webp";
      extension = "webp";
    }

    const key = `profile_${Date.now()}.${extension}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: outBuffer,
        ContentType: outMimetype,
        // Filenames are timestamped, so a given key's content never
        // changes — safe to cache for a year.
        CacheControl: "public, max-age=31536000, immutable",
        Tagging: "environment=production",
      },
    });

    const result = await upload.done();
    return result;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

export async function deleteFromS3(fileUrl: string) {
  try {
    const urlParts = fileUrl.split(".amazonaws.com/");
    const key = urlParts[1];

    if (!key) return;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: decodeURIComponent(key),
      }),
    );
  } catch (error) {
    console.error("S3 Delete Error:", error);
  }
}
