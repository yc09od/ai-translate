import 'dotenv/config'
import { connectMongoDB, disconnectMongoDB } from '../db/mongodb'
import { User } from '../models/User'
import { Topic } from '../models/Topic'
import { TranslationRecord } from '../models/TranslationRecord'

async function run() {
  console.log('🔌 Connecting to MongoDB...')
  await connectMongoDB()
  console.log('✅ Connected\n')

  // Clean up previous test data
  await User.deleteMany({ email: 'test@example.com' })

  // 1. Create User
  const user = await User.create({
    email: 'test@example.com',
    name: 'Test User',
    provider: 'google',
  })
  console.log('✅ User created:', user._id.toString())

  // 2. Create Topic
  const topic = await Topic.create({
    userId: user._id,
    title: '测试话题',
    sourceLang: 'zh',
    targetLang: 'en',
  })
  console.log('✅ Topic created:', topic._id.toString())

  // 3. Create TranslationRecord
  const record = await TranslationRecord.create({
    topicId: topic._id,
    userId: user._id,
    originalText: '你好世界',
    translatedText: 'Hello World',
  })
  console.log('✅ TranslationRecord created:', record._id.toString())

  // 4. Verify by reading back
  const foundUser = await User.findById(user._id)
  const foundTopic = await Topic.findById(topic._id)
  const foundRecord = await TranslationRecord.findOne({ topicId: topic._id })

  console.log('\n📋 Verification:')
  console.log('  User:', foundUser?.email, '| provider:', foundUser?.provider)
  console.log('  Topic:', foundTopic?.title, '| langs:', foundTopic?.sourceLang, '->', foundTopic?.targetLang)
  console.log('  Record:', foundRecord?.originalText, '->', foundRecord?.translatedText)

  await disconnectMongoDB()
  console.log('\n🔌 Disconnected. All tests passed!')
}

run().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
