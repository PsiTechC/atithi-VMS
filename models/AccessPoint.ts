import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccessPoint extends Document {
  clientId: Types.ObjectId; // 🔒 tenant scope
  name: string;
  description?: string;
  location?: string;
  deviceId?: string | null;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccessPointSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true }, // ❗ no global unique here
    description: { type: String },
    location: { type: String },
    // Optional hardware device identifier (e.g. MQTT device id)
    deviceId: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// ✅ per-client unique constraint for AccessPoint names
AccessPointSchema.index({ clientId: 1, name: 1 }, { unique: true });
// (Optional) helpful filter index
AccessPointSchema.index({ clientId: 1, active: 1 });

export default mongoose.models.AccessPoint ||
  mongoose.model<IAccessPoint>('AccessPoint', AccessPointSchema);
