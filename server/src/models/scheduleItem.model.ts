import { Schema, type Model, type Connection } from "mongoose";

export type ScheduleItemKind = "reminder" | "questionnaire" | "appointment";

export interface IScheduleItem {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  kind: ScheduleItemKind;
  title: string;
  scheduledAt: Date;
  completedAt?: Date | null;
  /** Questionnaires respect this; other kinds ignore (treated as active). */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleItemSchema = new Schema<IScheduleItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    kind: {
      type: String,
      enum: ["reminder", "questionnaire", "appointment"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

scheduleItemSchema.index({ userId: 1, scheduledAt: 1 });
scheduleItemSchema.index({ userId: 1, completedAt: 1 });

export const getScheduleItemModel = (conn: Connection): Model<IScheduleItem> =>
  conn.models.ScheduleItem ||
  conn.model<IScheduleItem>("ScheduleItem", scheduleItemSchema);
