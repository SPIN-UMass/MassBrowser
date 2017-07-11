<template lang="pug">
    .status {{text}}
</template>

<script>
  // import Bus from '~/utils/bus'
  import Status from '~/utils/status'

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
      var currentStatus = null

      const progressListener = (status) => {
        this.text = status.message
      }

      const removePreviousStatus = () => {
        if (status.statusType === Status.STATUS_PROGRESS) {
          currentStatus.removeListener('update', progressListener)
        }
        currentStatus = null
      }

      const showStatus = (status) => {
        currentStatus = status
        if (status.statusType === Status.STATUS_LOG) {
          this.text = status.message
          this.show = true
          this.level = status.level
        } else if (status.statusType === Status.STATUS_PROGRESS) {
          this.text = status.message
          status.on('update', progressListener)
          this.show = true
        }
      }
      
      const clearStatus = () => {
        this.text = ''
        this.show = false
        this.level = false
      }
      Status.on('status-changed', showStatus)
      Status.on('status-cleared', clearStatus)

      Status.emit('status-request')
    }
  }
</script>

<style scoped>
</style>
