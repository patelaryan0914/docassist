import { Schema, type Model, type Connection } from 'mongoose';

export interface IMessageMediaItem {
    url: string;
    mimeType: string;
    fileName?: string;
    mediaType?: 'image' | 'audio' | 'video' | 'document';
}

export interface IMessage {
    _id: Schema.Types.ObjectId;
    conversationId: Schema.Types.ObjectId;
    sender: 'user' | 'assistant';
    content: string;
    media?: IMessageMediaItem[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversations' },
        sender: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        media: [
            {
                url: { type: String, required: true },
                mimeType: { type: String, required: true },
                fileName: { type: String, required: false },
                mediaType: {
                    type: String,
                    enum: ['image', 'audio', 'video', 'document'],
                    required: false,
                },
            },
        ],
    },
    { timestamps: true },
);

export const getMessagesModel = (conn: Connection): Model<IMessage> =>
    conn.models.Messages || conn.model<IMessage>('Messages', messageSchema);
