import { Schema, type Model, type Connection } from 'mongoose';

export interface IConversations {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const conversationsSchema = new Schema<IConversations>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'Users' },
        name: { type: String, required: true },
    },
    { timestamps: true },
);

export const getConversationsModel = (conn: Connection): Model<IConversations> =>
    conn.models.Conversations || conn.model<IConversations>('Conversations', conversationsSchema);
