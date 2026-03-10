import 'dotenv/config'
import { connectRedis, disconnectRedis, redis } from '../db/redis'

async function run() {
  console.log('🔌 Connecting to Redis...')
  await connectRedis()
  console.log('✅ Connected\n')

  // 1. SET / GET
  await redis.set('test:key', 'hello redis', 'EX', 60)
  const value = await redis.get('test:key')
  console.log('✅ SET/GET:', value)

  // 2. TTL
  const ttl = await redis.ttl('test:key')
  console.log('✅ TTL:', ttl, 'seconds')

  // 3. Store a session object (simulate user session)
  const session = { userId: 'user_001', email: 'test@example.com', provider: 'google' }
  await redis.set('session:user_001', JSON.stringify(session), 'EX', 3600)
  const raw = await redis.get('session:user_001')
  const parsed = JSON.parse(raw!)
  console.log('✅ Session stored:', parsed)

  // 4. DEL
  await redis.del('test:key')
  const deleted = await redis.get('test:key')
  console.log('✅ DEL test:key:', deleted === null ? 'key removed' : 'FAILED')

  console.log('\n📋 Keys remaining in Redis (session:*):')
  const keys = await redis.keys('session:*')
  console.log(' ', keys)

  await disconnectRedis()
  console.log('\n🔌 Disconnected. All tests passed!')
}

run().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
