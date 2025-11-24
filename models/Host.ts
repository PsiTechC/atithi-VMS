


// import mongoose, { Schema, Document, Types } from 'mongoose';

// export interface IHost extends Document {
//   name: string;
//   department: string;
//   email: string;
//   phone?: string;
//   clientId: Types.ObjectId;
//   imageUrl?: string;          // ⬅️ NEW: R2 URL
//   isActive: boolean;          // ⬅️ NEW: active/inactive
//   bloodGroup?: string;        // ⬅️ NEW: optional
//   approvalRequired: boolean;  // ⬅️ NEW: require approval
//   createdAt: Date;
//   updatedAt: Date;
// }

// const HostSchema: Schema = new Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     department: { type: String, required: true, trim: true },
//     email: { type: String, required: true, trim: true, lowercase: true },
//     phone: { type: String },
//     clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },

//     // 🔽 New fields
//     imageUrl: { type: String, default: "" },
//     isActive: { type: Boolean, default: true },
//     bloodGroup: {
//       type: String,
//       enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
//       default: null,
//     },
//     approvalRequired: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

// // ✅ tenant-scoped uniqueness + helpful indexes
// HostSchema.index({ clientId: 1, email: 1 }, { unique: true });
// HostSchema.index({ clientId: 1, name: 1 });
// HostSchema.index({ clientId: 1, phone: 1 });
// HostSchema.index({ clientId: 1, department: 1 });

// export default mongoose.models.Host || mongoose.model<IHost>("Host", HostSchema);


import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHost extends Document {
  name: string;
  department: string;
  email: string;
  phone?: string;                // old single number (legacy)
  phones?: string[];             // new: multiple phone numbers
  clientId: Types.ObjectId;
  imageUrl?: string;
  isActive: boolean;
  bloodGroup?: string;
  approvalRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    // 🆕 New field (array of phone numbers)
    phones: {
      type: [String],
      validate: {
        validator: function (arr: string[]) {
          // allow empty if old 'phone' field is used
          return Array.isArray(arr);
        },
        message: "Phones must be an array of strings.",
      },
      default: [],
    },

    // ✅ Keep legacy single phone for backward compatibility
    phone: { type: String },

    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: null,
    },
    approvalRequired: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// ✅ tenant-scoped uniqueness + helpful indexes
HostSchema.index({ clientId: 1, email: 1 }, { unique: true });
HostSchema.index({ clientId: 1, name: 1 });
HostSchema.index({ clientId: 1, phone: 1 });
HostSchema.index({ clientId: 1, department: 1 });

// 🧠 Auto-migrate single phone → phones[] when saving
HostSchema.pre("save", function (next) {
  const host = this as any;
  if ((!host.phones || host.phones.length === 0) && host.phone) {
    host.phones = [host.phone];
  }
  next();
});

export default mongoose.models.Host || mongoose.model<IHost>("Host", HostSchema);
