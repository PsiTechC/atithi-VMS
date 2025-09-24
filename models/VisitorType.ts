// models/VisitorType.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisitorType extends Document {
  clientId: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  accessLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorTypeSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true, trim: true }, // ⛔ remove global unique
    description: { type: String },
    color: { type: String },
    accessLevel: { type: String },
  },
  { timestamps: true }
);

// ✅ per-client uniqueness + helpful indexes
VisitorTypeSchema.index({ clientId: 1, name: 1 }, { unique: true });
VisitorTypeSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.VisitorType ||
  mongoose.model<IVisitorType>('VisitorType', VisitorTypeSchema);
