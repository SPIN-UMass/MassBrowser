<template lang="pug">
    .status-container
        .serverConnection
            span ServerConnection
                button.btn.btn-rounded.btn-lg.statusbtn(:disabled="false" v-bind:class="{'btn-danger': !WSconnected, 'btn-success': WSconnected}")
        .reachable
            span Reachable
                button.btn.btn-rounded.btn-lg.statusbtn(:disabled="false" v-bind:class="{'btn-danger': !reachable, 'btn-success': reachable}")

</template>

<script>
  import { getService } from '@utils/remote'

  const StatusReporter = getService('statusReporter')

  export default {
    data () {
      return {
        text: '',
        show: false,
        reachable: false,
        WSconnected: false,
        closable: false,
        level: ''
      }
    },
    created () {
      StatusReporter.reachable.then(reachable => this.reachable = reachable)
      StatusReporter.WSconnected.then(WSconnected => this.WSconnected = WSconnected)

      const showStatus = async () => {
        this.reachable = await StatusReporter.reachable
        this.WSconnected = await StatusReporter.WSconnected
      }

      const clearStatus = () => {
        this.text = ''
        this.show = false
        this.level = false
        this.closable = false
      }

      StatusReporter.on('status-updated', showStatus)
    }
  }
</script>

<style scoped lang='scss'>
    @import '~@common/styles/settings.scss';

    .status-container {

        .serverConnection {
            float: left;

        }
        .reachable {
            float: left;
            margin-left: 30px;

        }
        .statusbtn {
            margin-left: 5px;
            width: 5px;
        }

    }


</style>
