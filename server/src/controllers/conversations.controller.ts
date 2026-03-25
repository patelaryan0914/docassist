import type { Request, Response, NextFunction } from "express"
import { getConversationsModel } from "../models/conversations.model";
import { getConnection } from "../utils/Connections";
import { ApiResponse } from "../utils/ApiResponse";

export const createConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name = "New Chat" } = req.body;
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const newConversation = new Conversation({ name, userId: req.userId });
        await newConversation.save();
        res.status(201).json(ApiResponse.success({ newConversation }, "Conversation created successfully"));
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
        let { page = 1, limit = 20 } = req.query;
        if (page == "") page = 1;
        if (limit == "") limit = 10;
        page = parseInt(page as string);
        limit = parseInt(limit as string);
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const conversations = await Conversation.find({ userId: req.userId }).sort({ createdAt: -1 }).select("_id name createdAt updatedAt").skip((page - 1) * limit).limit(limit);
        res.status(200).json(ApiResponse.success({ conversations }, "Conversations retrieved successfully"));
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

export const updateConversationName = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name } = req.body;
        const { conversationId } = req.params;
        if (!conversationId) {
            throw new Error("Conversation Id is required");
        }
        const dbConnection = await getConnection();
        const Conversation = getConversationsModel(dbConnection);
        const updatedConversation = await Conversation.findOneAndUpdate({ _id: conversationId, userId: req.userId }, { name }, { new: true }).select("_id name createdAt updatedAt");
        res.status(200).json(ApiResponse.success({ updatedConversation }, "Conversation updated successfully"));
    } catch (error) {
        next(error)
    }
};