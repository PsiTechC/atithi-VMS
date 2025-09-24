import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  clientId: Schema.Types.ObjectId;
  licenseType: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'expiring_soon';
  maxUsers: number;
  currentUsers: number;
}

const LicenseSchema: Schema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  licenseType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'expiring_soon'], default: 'active' },
  maxUsers: { type: Number, default: 1 },
  currentUsers: { type: Number, default: 0 },
});

export default mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);
