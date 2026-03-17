import { Schema, model, Document } from 'mongoose'

export interface IInvitationCode extends Document {
  code: string
  used: boolean
}

const InvitationCodeSchema = new Schema<IInvitationCode>({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
})

export const InvitationCode = model<IInvitationCode>('InvitationCode', InvitationCodeSchema)
