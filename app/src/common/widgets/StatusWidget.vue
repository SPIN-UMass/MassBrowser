<template lang="pug">
    .status {{ status }}
</template>

<script>
  import { store } from '@utils/store'
  import { STATUS_LOG, STATUS_PROGRESS} from '@common/services/StatusService'

  export default {
    store,
    computed: {
      status: function() {
        let status = this.$store.state.status
        if (status.statusType === STATUS_LOG) {
          return status.message
        } else if (status.statusType === STATUS_PROGRESS) {
          return status.message
        } else {
          return ''
        }
      }
    }
  }
</script>

<style scoped>
</style>
