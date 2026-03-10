import 'dotenv/config'
import { connectRedis, disconnectRedis } from '../db/redis'
import { setSession, getSession, deleteSession } from '../services/sessionStore'

async function run() {
  await connectRedis()

  const userId = 'user_test_001'
  const sessionData = { userId, email: 'test@example.com', provider: 'google' }

  // 1. Set session (login)
  await setSession(userId, sessionData)
  console.log('✅ Session set (login)')

  // 2. Get session (auth check)
  const found = await getSession(userId)
  console.log('✅ Session retrieved:', found)

  // 3. Delete session (logout)
  await deleteSession(userId)
  const afterLogout = await getSession(userId)
  console.log('✅ Session after logout:', afterLogout === null ? 'null (deleted)' : 'FAILED')

  await disconnectRedis()
  console.log('All session tests passed!')
}

run().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
