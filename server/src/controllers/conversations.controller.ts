import type { Request, Response, NextFunction } from "express"
import { getConversationsModel } from "../models/conversations.model.js";
import { getMessagesModel } from "../models/message.model.js";
import { getConnection } from "../utils/Connections.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeDocumentationSlug } from "../constants/documentation.js";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function serializeConversation(doc: {
    _id: unknown;
    name: string;
    documentation?: string;
    createdAt?: Date;
    updatedAt?: Date;
}) {
    return {
        _id: String(doc._id),
        name: doc.name,
        documentation: normalizeDocumentationSlug(doc.documentation),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

export const createConversation = async (
    req: Request & { userId: string },
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name = "New Chat", documentation: docRaw } = req.body as {
            name?: string;
            documentation?: string;
        };
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const documentation = normalizeDocumentationSlug(docRaw);
        const newConversation = new Conversation({
            name,
            userId: req.userId,
            documentation,
        });
        await newConversation.save();
        res.status(201).json(
            ApiResponse.success(
                { newConversation: serializeConversation(newConversation) },
                "Conversation created successfully",
            ),
        );
    } catch (error) {
        next(error)
    }
}

export const getAllConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let { page = 1, limit = 20, search } = req.query;
        if (page == "") page = 1;
        if (limit == "") limit = 10;
        page = parseInt(page as string);
        limit = parseInt(limit as string);
        const searchRaw =
            typeof search === "string" ? search.trim().slice(0, 120) : "";
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const filter: Record<string, unknown> = { userId: req.userId };
        if (searchRaw) {
            filter.name = { $regex: escapeRegex(searchRaw), $options: "i" };
        }
        const conversations = await Conversation.find(filter)
            .sort({ createdAt: -1 })
            .select("_id name documentation createdAt updatedAt")
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(
            ApiResponse.success(
                {
                    conversations: conversations.map((c) =>
                        serializeConversation(c as Parameters<typeof serializeConversation>[0]),
                    ),
                },
                "Conversations retrieved successfully",
            ),
        );
    } catch (error) {
        next(error)
    }
}

export const deleteConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            throw new Error("Conversation Id is required");
        }
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        await Conversation.findOneAndDelete({ _id: conversationId, userId: req.userId });
        res.status(200).json(ApiResponse.success({}, "Conversation deleted successfully"));
    } catch (error) {
        next(error)
    }
}

export const updateConversation = async (
    req: Request & { userId: string },
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, documentation } = req.body as {
            name?: string;
            documentation?: string;
        };
        const { conversationId } = req.params;
        if (!conversationId) {
            throw ApiError.badRequest("Conversation Id is required");
        }
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const Message = getMessagesModel(dbConnection);

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: req.userId,
        });
        if (!conversation) {
            throw ApiError.notFound("Conversation not found");
        }

        const messageCount = await Message.countDocuments({ conversationId });
        const updates: { name?: string; documentation?: string } = {};

        if (name !== undefined) {
            updates.name = name;
        }
        if (documentation !== undefined) {
            if (messageCount > 0) {
                throw ApiError.badRequest(
                    "Cannot change documentation after messages exist in this chat",
                );
            }
            updates.documentation = normalizeDocumentationSlug(documentation);
        }

        if (Object.keys(updates).length === 0) {
            throw ApiError.badRequest("No valid fields to update");
        }

        const updatedConversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, userId: req.userId },
            { $set: updates },
            { new: true },
        ).select("_id name documentation createdAt updatedAt");

        res.status(200).json(
            ApiResponse.success(
                {
                    updatedConversation: updatedConversation
                        ? serializeConversation(updatedConversation)
                        : null,
                },
                "Conversation updated successfully",
            ),
        );
    } catch (error) {
        next(error)
    }
};