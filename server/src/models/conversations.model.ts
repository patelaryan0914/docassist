import { Schema, type Model, type Connection } from 'mongoose';
import {
    DOCUMENTATION_SLUGS,
    type DocumentationSlug,
} from '../constants/documentation.js';

export interface IConversations {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    name: string;
    documentation?: DocumentationSlug;
    createdAt: Date;
    updatedAt: Date;
}

const conversationsSchema = new Schema<IConversations>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'Users' },
        name: { type: String, required: true },
        documentation: {
            type: String,
            enum: DOCUMENTATION_SLUGS,
            default: 'stripe',
        },
    },
    { timestamps: true },
);

export const getConversationsModel = (conn: Connection): Model<IConversations> =>
    conn.models.Conversations || conn.model<IConversations>('Conversations', conversationsSchema);
