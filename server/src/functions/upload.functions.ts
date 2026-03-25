import { S3, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "path";
import mime from "mime-types";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/Logger.js";

const s3 = new S3({
    endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
    region: process.env.DO_SPACES_REGION!,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
    },
});

const awsS3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
});

export async function uploadFilePathToS3(
    filePath: string,
    originalName: string,
    metaData?: Record<string, string>,
    folder: string = "bandhucare_test",
    deleteFile: boolean = true
): Promise<string> {
    if (!fs.existsSync(filePath)) {
        throw ApiError.internal(`File not found before upload: ${filePath}`);
    }
    const extension = path.extname(originalName);
    const mimeType = mime.lookup(originalName) || "application/octet-stream";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `${folder}/${path.basename(originalName, extension)}-${uniqueSuffix}${extension}`;
    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: fileName,
        Body: fileStream,
        ContentType: mimeType,
        ACL: "public-read",
        Metadata: metaData,
    });
    try {
        await s3.send(command);
        if (deleteFile) {
            try {
                await fs.promises.unlink(filePath);
            } catch (err) {
                throw ApiError.internal("Error deleting local file after upload");
            }
        }
        return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;
    } catch (error) {
        throw ApiError.internal("Error uploading file to S3");
    }
}

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