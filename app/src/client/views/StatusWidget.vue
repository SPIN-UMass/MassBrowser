<template lang="pug">
    .status {{text}}
</template>

<script>
  // import Bus from '~/utils/bus'
  // import Status from '@utils/status'
  import { getService } from '@utils/remote'
  import { STATUS_LOG, STATUS_PROGRESS} from '@common/services/StatusService'

  const Status = getService('status')

  var currentStatus = null
  var listeners = {}

  export default {
    data () {
      return {
        text: '',
        show: false,
        closable: false,
        level: ''
      }
    },
    created () {
      Status.on('status-changed', this.onStatusChanged)
      Status.on('status-cleared', this.onStatusCleared)

      Status.emit('status-request')
    },
    beforeDestroy () {
      Status.removeListener('status-changed', this.onStatusChanged)
      Status.removeListener('status-cleared', this.onStatusCleared)

      for (let event in listeners) {
        Status.removeListener(event, listeners[event])
      }
    },
    methods: {
      onStatusChanged: function(status) {
        const progressListener = (status) => {
          this.text = status.message
        }

        currentStatus = status
        if (status.statusType === STATUS_LOG) {
          this.text = status.message
          this.show = true
          this.level = status.level
        } else if (status.statusType === STATUS_PROGRESS) {
          this.text = status.message
          Status.on(`status-progress-${status.key}-update`, progressListener)
          listeners[`status-progress-${status.key}-update`] = progressListener
          this.show = true
        }
      },
      onStatusCleared: function() {
        this.text = ''
        this.show = false
        this.level = false
      }
    }
  }
</script>

<style scoped>
</style>
