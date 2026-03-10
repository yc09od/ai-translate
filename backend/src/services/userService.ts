import { User, IUser } from '../models/User'

export async function findByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email })
}

export async function createUser(data: {
  email: string
  name: string
  provider: 'google' | 'hotmail'
}): Promise<IUser> {
  return User.create(data)
}
