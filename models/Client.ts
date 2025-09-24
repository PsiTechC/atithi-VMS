import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  contacts?: string;
  address?: string;
  instructions?: string;
  licenseStart: Date;
  licenseEnd: Date;
  isActive: boolean;
  otpRequired: boolean;
  logoUrl?: string;
  status: 'active' | 'expired' | 'suspended';
  licenseExpiry?: Date;
  users: number;
  lastActive: Date;
  passwordHash: string | null;
  passwordSetAt: Date | null;
  plainPassword: string | null;
  defaultCheckoutHour?: number;
}

const ClientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    contacts: { type: String },
    address: { type: String },
    instructions: { type: String },
    licenseStart: { type: Date, required: true },
    licenseEnd: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    otpRequired: { type: Boolean, default: false },
    logoUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
    },
    licenseExpiry: { type: Date },
    users: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    passwordHash: { type: String, default: null },
    passwordSetAt: { type: Date, default: null },
    plainPassword: { type: String, default: null },
    defaultCheckoutHour: { type: Number, default: 0 }, // 6 PM
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Client ||
  mongoose.model<IClient>('Client', ClientSchema);
