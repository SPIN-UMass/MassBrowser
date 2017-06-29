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
      const showStatus = (status) => {
        this.text = status.text
        this.show = true
        this.level = status.options.level ? status.options.level : ''
        this.closable = status.options.closable
      }
      const clearStatus = () => {
        this.text = ''
        this.show = false
        this.level = false
        this.closable = false
      }
      Status.on('status-changed', showStatus)
      Status.on('status-cleared', clearStatus)

      Status.emit('status-request')
    }
  }
</script>

<style scoped>
</style>
