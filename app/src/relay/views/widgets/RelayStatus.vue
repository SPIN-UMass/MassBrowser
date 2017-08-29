<template lang="pug">
  #m-relay-status
    .status-container
      .status.serverConnection
        .status-led(v-bind:class="{'off': !WSconnected, 'on': WSconnected}")
        span.status-label ServerConnection
      .status.reachable
        .status-led(v-bind:class="{'off': !reachable, 'on': reachable}")
        span.status-label Reachable
        
    .toggle-container
      toggle-button.toggle( v-on:change="onChange", :labels= {
        checked: 'Open Access',
        unchecked: 'Offline'
      }   v-bind:value="accessStatus" v-bind:width="95" )
      //- span.relaytext Status:

</template>

<script>
  import { getService } from '@utils/remote'

  const StatusReporter = getService('statusReporter')
  const HealthManager = getService('health')

  export default {
    data () {
      return {
        reachable: false,
        WSconnected: false,
        openAccess: false
      }
    },
    created () {
      StatusReporter.reachable.then(reachable => this.reachable = reachable)
      StatusReporter.WSconnected.then(WSconnected => this.WSconnected = WSconnected)
      StatusReporter.on('status-updated', this.onStatusUpdated)
      HealthManager.openAccess.then(openAccess => this.openAccess = openAccess)
    },
    beforeDestroy() {
      StatusReporter.removeListener('status-updated', this.onStatusUpdated)
    },
    methods: {
      onStatusUpdated: async function() {
        this.reachable = await StatusReporter.reachable
        this.WSconnected = await StatusReporter.WSconnected
      },
      onChange: function (e) {
        if (e.value) {
          HealthManager.changeAccess(e.value)
        }
        else {
          HealthManager.changeAccess(e.value)
        }
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@common/styles/settings.scss';

  #m-relay-status {
    background: #fcfcfc;
    
    padding: 5px 10px 5px 20px;
    .status-container {
      // position: absolute;
      // left: 10px;
      display: inline-block;

      .status {
        display: inline-block;
        vertical-align: middle;
      }
      
      .status-label {
        vertical-align: middle;
        margin-left: 10px;
        margin-right: 20px;
      }

      .status-led {
        vertical-align: middle;
        display: inline-block;
        width: 30px;
        height: 20px;
        border-radius: 35%;

        &.on {
          background: #8cc74f;
          border-color: #91c957;
        }

        &.off {
          background: #f75d3f;
          border-color: #f76549;
        }
      }
    }
    .toggle-container {
      display: inline-block;
      position: absolute;
      right: 10px;
    }
    
  }
</style>
