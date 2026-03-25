import { Schema, type Model, type Connection } from 'mongoose';

export interface IAccounts {
  userId: Schema.Types.ObjectId;
  provider: string;
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
  idToken?: string | null;
  password?: string | null;
  createdAt: string;
  updatedAt: string;
}

const accountsSchema = new Schema<IAccounts>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    provider: {
      type: String,
      enum: ['credentials', 'abhaMobile', 'abhaAadhaar', 'google'],
      required: true,
    },
    accessToken: { type: String, default: null },
    accessTokenExpiresAt: { type: String, default: null },
    refreshToken: { type: String, default: null },
    refreshTokenExpiresAt: { type: String, default: null },
    idToken: { type: String, default: null },
    password: {
      type: String,
      required: function (this: IAccounts) {
        return this.provider === 'credentials';
      },
    },
  },
  { timestamps: true },
);

export const getAccountsModel = (conn: Connection): Model<IAccounts> =>
  conn.models.Accounts || conn.model<IAccounts>('Accounts', accountsSchema);
