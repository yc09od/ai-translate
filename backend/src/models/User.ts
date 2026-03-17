import { Schema, model, Document } from 'mongoose'

export type UserRole = 'customer' | 'agent' | 'admin'

export interface IUser extends Document {
  email: string
  name: string
  provider: 'google' | 'hotmail'
  active: boolean
  role: UserRole
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, enum: ['google', 'hotmail'], required: true },
    active: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'agent', 'admin'], default: 'customer' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const User = model<IUser>('User', UserSchema)
