import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  followRegionRedirects: true,
});

export const uploadToS3 = async (
  buffer: Buffer,
  fileName: string,
  mimetype: string,
) => {
  try {
    const extension = mimetype.split("/")[1] || "png";
    const key = `profile_${Date.now()}.${extension}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
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
