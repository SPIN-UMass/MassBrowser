<template lang="pug">
  #m-relay-status
    .alert.alert-primary.status-box.running(v-if='openAccess')
      h4 #[strong MassBuddy] is up and running! 
      p You can safely close this window, #[strong MassBuddy] will continue running in the background.
      div.btn-container
        button.btn.btn-danger(v-on:click='onChange(false)') Stop MassBuddy
    .alert.alert-danger.status-box.not-running(v-if='!openAccess')
      h4 #[strong MassBuddy] is not running! 
      p To start allowing client connections, click the button below.
      div.btn-container
        button.btn.btn-success(v-on:click='onChange(true)') Start MassBuddy
    .status-container
      .row.row-stat
        .col-xs-1.col-led
          .status-led(v-bind:class="{'off': !connected, 'on': connected}")  
        .col-xs-8.col-text
          span.status-label(v-if='connected') Connection with server working
          span.status-label(v-if='!connected') Cannot establish connection with server
      .row.row-stat
        .col-xs-1.col-led
          .status-led(v-bind:class="{'off': !reachable, 'on': reachable}")  
        .col-xs-8.col-text
          span.status-label(v-if='reachable') MassBuddy reachable by clients
          span.status-label(v-if='!reachable') MassBuddy is not reachable by clients
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
      onChange: function (openAccess) {
        if (openAccess) {
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

    padding: 5px 10px 5px 10px;

    .status-box {
      margin: 5px 15px 10px 15px;
      border-left: none;
      .title {
        font-size: 16px;
      }
      .btn-container {
        text-align: right;
      }
      
      &.running {
        .btn-container {
          margin-top: -5px;
        }  
      }

      &.not-running {
        .btn-container {
          margin-top: 10px;
        }  
      }
    }
    
    .status-container {
      padding: 0px 10px;

      .col-led {
        text-align: right;
      }

      .col-text {
        // padding: 0px;
      }

      .row-stat {
        margin-top: 5px;
      }

      .status {
        vertical-align: middle;
      }
      
      .status-label {
        vertical-align: middle;
        // font-weight: bold;
      }

      .status-led {
        vertical-align: middle;
        display: inline-block;
        width: 11px;
        height: 11px;
        border-radius: 50%;

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
