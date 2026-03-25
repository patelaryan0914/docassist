import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadImageToAwsS3 } from "../functions/upload.functions.js";

const ALLOWED_MIME_PREFIXES = [
    "image/",
    "audio/",
    "video/",
    "text/",
];

const ALLOWED_EXACT_MIME_TYPES = new Set([
    "application/pdf",
    "application/json",
    "application/xml",
    "application/rtf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function getMediaType(mimeType: string): "image" | "audio" | "video" | "document" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    return "document";
}

function isAllowedMimeType(mimeType: string): boolean {
    if (ALLOWED_EXACT_MIME_TYPES.has(mimeType)) return true;
    return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export const uploadMedia = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const file = req.file;
        if (!file) {
            throw ApiError.badRequest("Media file is required (field: file)");
        }

        if (!isAllowedMimeType(file.mimetype)) {
            throw ApiError.badRequest("Unsupported media type for LLM upload");
        }

        const maxBytes = 25 * 1024 * 1024; // 25MB
        if (file.size > maxBytes) {
            throw ApiError.badRequest("File size must be <= 25MB");
        }

        const url = await uploadImageToAwsS3(
            file.path,
            file.originalname,
            "docassist/media",
        );

        res.status(201).json(
            ApiResponse.created(
                {
                    url,
                    key: new URL(url).pathname.replace(/^\/+/, ""),
                    mediaType: getMediaType(file.mimetype),
                    mimeType: file.mimetype,
                    size: file.size,
                },
                "Media uploaded successfully",
            ),
        );
    } catch (error) {
        next(error);
    }
};
