import { Schema, type Model, type Connection } from 'mongoose';

export interface IUsers {
  _id: Schema.Types.ObjectId;
  fcmToken?: string;
  userType: string;
  name: string;
  email: string;
  emailVerified: boolean;
  mobileNumber: string;
  mobileNumberVerified: boolean;
  photo: string;
  otp: string;
  otpExpiresAt: string;
  status: "verified" | "pending" | "deleted";
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const usersSchema = new Schema<IUsers>(
  {
    fcmToken: { type: String },
    name: {
      type: String,
    },
    email: { type: String },
    emailVerified: { type: Boolean },
    mobileNumber: { type: String },
    mobileNumberVerified: { type: Boolean },
    photo: { type: String },
    status: { type: String, default: 'pending' },
    deletedAt: { type: Date },
    otp: { type: String },
    otpExpiresAt: { type: String },
  },
  { timestamps: true },
);

export const getUsersModel = (conn: Connection): Model<IUsers> =>
  conn.models.Users || conn.model<IUsers>('Users', usersSchema);
