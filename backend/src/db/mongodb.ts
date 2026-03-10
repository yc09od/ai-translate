import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-translate'

export async function connectMongoDB() {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected')
  })
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  await mongoose.connect(MONGODB_URI)
}

export async function disconnectMongoDB() {
  await mongoose.disconnect()
}
