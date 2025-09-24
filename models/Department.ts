import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  },
  { timestamps: true }
);
DepartmentSchema.index({ clientId: 1, name: 1 }, { unique: true });
// (Optional) helpful filter index
DepartmentSchema.index({ clientId: 1, active: 1 });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
