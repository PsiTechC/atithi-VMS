// models/Purpose.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPurpose extends Document {
  clientId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurposeSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true, trim: true }, // ⛔ remove global unique
    description: { type: String },
  },
  { timestamps: true }
);

// ✅ per-client uniqueness + helpful indexes
PurposeSchema.index({ clientId: 1, name: 1 }, { unique: true });
PurposeSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.Purpose ||
  mongoose.model<IPurpose>('Purpose', PurposeSchema);
