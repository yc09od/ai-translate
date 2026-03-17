import { Schema, model, Document } from 'mongoose'

export interface IInvitationCode extends Document {
  code: string
  used: boolean
  role: string
  createdAt: Date
}

const InvitationCodeSchema = new Schema<IInvitationCode>(
  {
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'agent', 'admin'], default: 'customer' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const InvitationCode = model<IInvitationCode>('InvitationCode', InvitationCodeSchema)
