
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisitor extends Document {
  clientId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  company?: string;
  passId?: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    company: { type: String },
    passId: { type: String },
    qrCode: { type: String },
  },
  {
    timestamps: true,
  }
);
VisitorSchema.index({ clientId: 1, phone: 1 }, { unique: true });
VisitorSchema.index({ clientId: 1, name: 1 });

export default mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);
