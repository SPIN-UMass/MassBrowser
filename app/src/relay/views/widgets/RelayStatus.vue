<template lang="pug">
  #m-relay-status
    .status-container
      .status.serverConnection
        .status-led(v-bind:class="{'off': !connected, 'on': connected}")
        span.status-label ServerConnection
      .status.reachable
        .status-led(v-bind:class="{'off': !reachable, 'on': reachable}")
        span.status-label Reachable
        
    .toggle-container
      toggle-button.toggle(v-on:change="onChange", :labels= {
        checked: 'Open Access',
        unchecked: 'Offline'
      }   v-bind:value="openAccess" v-bind:width="95" :sync="true")
      //- span.relaytext Status:

</template>

<script>
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')

  export default {
    store,
    data () {
      return {
      }
    },
    computed: mapState({
      reachable: 'isRelayReachable',
      connected: 'isServerConnected',
      openAccess: 'openAccess'
    }),
    methods: {
      onChange: function (e) {
        if (e.value) {
          relayManager.startRelay()
        } else {
          relayManager.stopRelay()
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
