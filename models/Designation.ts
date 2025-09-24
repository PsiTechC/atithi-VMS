import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDesignation extends Document {
  name: string;
  description?: string;
  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  },
  { timestamps: true }
);
DesignationSchema.index({ clientId: 1, name: 1 }, { unique: true });
// (Optional) helpful filter index
DesignationSchema.index({ clientId: 1, active: 1 });

export default mongoose.models.Designation || mongoose.model<IDesignation>('Designation', DesignationSchema);
