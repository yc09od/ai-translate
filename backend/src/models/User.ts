import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  name: string
  provider: 'google' | 'hotmail'
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, enum: ['google', 'hotmail'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const User = model<IUser>('User', UserSchema)
