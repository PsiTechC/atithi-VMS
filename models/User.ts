// import mongoose, { Schema, Document } from 'mongoose';

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   role: 'super-admin' | 'client-admin' | 'client-user';
//   clientId?: Schema.Types.ObjectId;
// }

// const UserSchema: Schema = new Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['super-admin', 'client-admin', 'client-user'], required: true },
//   clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
// });

// export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


// models/User.ts
import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "client-admin" | "client-user";

export interface ClientUser {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;         // tenant boundary
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "suspended";
  passwordHash?: string;            // bcrypt
  inviteToken?: string;
  inviteExpires?: Date;
  photoUrl?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<ClientUser>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["client-admin", "client-user"], required: true },
    status: { type: String, enum: ["active", "pending", "suspended"], default: "pending" },
    passwordHash: { type: String },
    inviteToken: { type: String },
    inviteExpires: { type: Date },
    photoUrl: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Enforce unique email per client
UserSchema.index({ clientId: 1, email: 1 }, { unique: true });

export default (mongoose.models.User as mongoose.Model<ClientUser>) ||
  mongoose.model<ClientUser>("User", UserSchema);
