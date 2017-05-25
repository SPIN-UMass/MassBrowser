import bootClient from './boot'
import Status from '~/utils/status'

Status.on('status-changed', function(status) {
  console.log(status.text)
})

bootClient()