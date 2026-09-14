import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "path";
import mime from "mime-types";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/Logger.js";

const awsS3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function uploadImageToAwsS3(
  filePath: string,
  originalName: string,
  folder: string = "uploads/images",
): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw ApiError.badRequest("File not found for upload");
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) {
    throw ApiError.internal("AWS_S3_BUCKET or AWS_REGION is not configured");
  }

  const extension = path.extname(originalName);
  const mimeType = mime.lookup(originalName) || "application/octet-stream";
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const key = `${folder}/${path.basename(originalName, extension)}-${uniqueSuffix}${extension}`;
  const fileStream = fs.createReadStream(filePath);

  try {
    await awsS3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: mimeType,
      }),
    );

    await fs.promises.unlink(filePath).catch(() => undefined);

    const customBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
    if (customBaseUrl) {
      return `${customBaseUrl.replace(/\/+$/, "")}/${key}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error("AWS S3 upload failed", { error });
    throw ApiError.internal("Error uploading file to AWS S3");
  }
}
