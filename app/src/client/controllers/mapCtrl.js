import { createController } from '@utils/remote'
import SessionService from '@/services/SessionService'

async function getSessions() {
  let sessions = SessionService.getSessions()
  return sessions.map(s => { return {id: s.id, ip: s.ip, state: s.state} })
}

export default createController('map', {
  getSessions
})