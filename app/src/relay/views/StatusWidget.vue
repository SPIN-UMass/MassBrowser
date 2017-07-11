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
  // import Bus from '~/utils/bus'
  import StatusReporter from '~/relay/net/StatusReporter'

  export default {
    data () {
      return {
        text: '',
        show: false,
        reachable: StatusReporter.reachable,
        WSconnected: StatusReporter.WSconnected,
        closable: false,
        level: ''
      }
    },
    created () {
      const showStatus = () => {
        this.reachable = StatusReporter.reachable
        this.WSconnected = StatusReporter.WSconnected

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
    @import '~styles/settings.scss';

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
