
import KVStore from '@utils/kvstore'
import { HttpTransport } from '@utils/transport'
import config from '@utils/config'
import api from '@/api'
import path from 'path'
import fs from 'fs-extra'
import { info, error, warn } from '@utils/log'

class FeedbackService {
  constructor() {
  }

  async sendFeedback(content, rating) {
    try {
      info('Sending user feedback to server')
      await api.sendFeedback(content, rating)
      return true
    } catch(e) {
      if (e.logAndReport) {
        e.logAndReport()
      } else {
        error(e);
      }
      return false
    }
  }
}

export const feedbackService = new FeedbackService()
export default feedbackService
