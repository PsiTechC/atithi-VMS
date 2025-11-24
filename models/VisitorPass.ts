   
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisitorPass extends Document {
  name: string;
  visitorType: string;
  comingFrom: string;
  purposeOfVisit: string;
  host: string;
  // hostId?: Types.ObjectId | null;
  idType: string;
  visitorIdText: string;
  passId: string;
  visitorId: Types.ObjectId;
  phone?: string;
  checkInDate: Date;
  checkOutDate?: Date | null;
  expectedCheckOutTime?: Date;
  email?: string;
  notes?: string;
  photoUrl?: string;
  qrCode: string;
  status: 'active' | 'checked_in' | 'checked_out' | 'expired';

  // Host approval workflow
  hostId?: Types.ObjectId | null;
  approvalRequired?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalToken?: string | null;
  approvalRequestedAt?: Date | null;
  approvalRespondedAt?: Date | null;
  approverHostId?: Types.ObjectId | null;

  movementHistory: Array<{
    timestamp: Date;
    type: 'check_in' | 'check_out';
    accessPointId?: Types.ObjectId;
    accessPointName?: string;
    method?: 'mobile' | 'passId' | 'qr' | 'manual' | 'create_with_photo' | 'unknown';
    actorUserId?: Types.ObjectId;
    notes?: string;
  }>;

  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 🧩 Define a new sub-schema for WhatsApp history
const WhatsAppMessageSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["success", "failure"], required: true },
  },
  { _id: false }
);

const MovementEventSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['check_in', 'check_out'], required: true },
    accessPointId: { type: Schema.Types.ObjectId, ref: 'AccessPoint' },
    accessPointName: { type: String },
    method: {
      type: String,
      enum: ['mobile', 'passId', 'qr', 'manual', 'create_with_photo', 'unknown'],
      default: 'unknown',
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const VisitorPassSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    visitorType: { type: String, required: true, trim: true },
    comingFrom: { type: String, required: true, trim: true },
    purposeOfVisit: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', default: null },
    idType: { type: String, required: true, trim: true },
    visitorIdText: { type: String, required: true, trim: true },
    passId: { type: String, required: true, trim: true },
    visitorId: { type: Schema.Types.ObjectId, ref: 'Visitor', required: true },
    phone: { type: String, required: true, trim: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, default: null },
    expectedCheckOutTime: { type: Date },
    email: { type: String, lowercase: true, trim: true },
    notes: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    qrCode: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'checked_in', 'checked_out', 'expired'],
      default: 'active',
    },
    // Host approval workflow fields
    approvalRequired: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    approvalToken: { type: String, index: true },
    approvalRequestedAt: { type: Date, default: null },
    approvalRespondedAt: { type: Date, default: null },
    approverHostId: { type: Schema.Types.ObjectId, ref: 'Host', default: null },
    // ✅ Ensure array is always initialized
    movementHistory: { type: [MovementEventSchema], default: [] },

        // 🧩 NEW — WhatsApp message history
    whatsappHistory: { type: [WhatsAppMessageSchema], default: [] },

    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  },
  { timestamps: true }
);

// Indexes
VisitorPassSchema.index({ clientId: 1, qrCode: 1 }, { unique: true });
VisitorPassSchema.index({ clientId: 1, status: 1, checkInDate: -1 });
VisitorPassSchema.index({ clientId: 1, visitorIdText: 1 });
VisitorPassSchema.index({ clientId: 1, passId: 1 });
VisitorPassSchema.index({ clientId: 1, createdAt: -1 });
// Speed up queries that look up the latest pass by phone for a client
VisitorPassSchema.index({ phone: 1, clientId: 1, checkInDate: -1 });

// Validate check-out not before check-in
VisitorPassSchema.pre('validate', function (next) {
  const doc = this as any;
  if (doc.checkInDate && doc.checkOutDate && doc.checkOutDate < doc.checkInDate) {
    return next(new Error('checkOutDate cannot be earlier than checkInDate'));
  }
  next();
});

export default mongoose.models.VisitorPass ||
  mongoose.model<IVisitorPass>('VisitorPass', VisitorPassSchema);
