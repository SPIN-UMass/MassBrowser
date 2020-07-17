<template lang="pug">
  #m-relay-status
    .status-container
      .row.row-stat
        .col-xs-1.col-led
          icon.status-led.on(name="check-circle"  scale="1.2" v-if="connected")
          icon.status-led.off(name="times-circle" scale="1.2" v-if="!connected")
        .col-xs-8.col-text
          span.status-label(v-if='connected') {{$t('RELAY_WORKING')}}
          span.status-label(v-if='!connected') {{$t('RELAY_NOT_WORKING')}}
      .row.row-stat
        .col-xs-1.col-led
          icon.status-led.on(name="check-circle"  scale="1.2" v-if="(reachableTCP || reachableUDP)")
          icon.status-led.off(name="times-circle" scale="1.2" v-if="!(reachableTCP || reachableUDP)")
        .col-xs-8.col-text
          span.status-label(v-if='(reachableTCP || reachableUDP)') {{$t('RELAY_REACHABLE')}}
          span.status-label(v-if='!(reachableTCP || reachableUDP)') {{$t('RELAY_NOT_REACHABLE')}}
</template>

<script>
  import { store } from '@utils/store'
  import { mapState } from 'vuex'


  export default {
    store,
    computed: mapState({
      reachableTCP: 'isTCPRelayReachable',
      reachableUDP: 'isUDPRelayReachable',
      connected: 'isServerConnected',
    }),
  }
</script>

<style scoped lang='scss'>
  @import '~@common/styles/settings.scss';

  #m-relay-status {
    background: #fcfcfc;

    padding: 5px 0;

    .status-container {
      padding: 0 20px;
      .row-stat {
        margin-top: 15px;

        .col-led {
          margin-top: 1px;
          margin-right: -3px;
          text-align: right;

          .on {
            color: #8cc74f;
          }

          .off {
            color: #f75d3f;
          }

          .status-led {
            vertical-align: middle;
            display: inline-block;
          }
        }

        .col-text {
          font-size: 15px;
          font-weight: 500;
          margin-top: -3px;
        }

        .status-label {
          vertical-align: middle;
          // font-weight: bold;
        }
      }
    }
  }
</style>
