import mongoose, { Schema, Document,Types } from 'mongoose';

export interface IIdType extends Document {
  clientId: Types.ObjectId; // 🔒 tenant scope
  name: string;
  description: string;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IdTypeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    required: { type: Boolean, default: false },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  },
  {
    timestamps: true,
  }
);
IdTypeSchema.index({ clientId: 1, name: 1 }, { unique: true });
// (Optional) helpful filter index
IdTypeSchema.index({ clientId: 1, active: 1 });

export default mongoose.models.IdType || mongoose.model<IIdType>('IdType', IdTypeSchema);
