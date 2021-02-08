<template lang="pug">
<div id="m-relay-status">
    <div class="status-container">
        <div class="row-stat">
            <div class="col-led">
                <i class="fa fa-2x fa-check-circle status-led on" name="check-circle" scale="1.2" v-if="connected"></i>
                <i class="fa fa-2x fa-check-circle status-led off" name="times-circle" scale="1.2" v-if="!connected"></i>
            </div>
            <div class="col-text">
            <span class="status-label" v-if="connected">{{$t('RELAY_WORKING')}}</span><span class="status-label" v-if="!connected">{{$t('RELAY_NOT_WORKING')}}</span>
            </div>
        </div>
        <div class="row-stat">
            <div class="col-led">
                <i class="fa fa-2x fa-check-circle status-led on" name="check-circle" scale="1.2" v-if="(reachableTCP || reachableUDP)"></i>
                <i class="fa fa-2x fa-check-circle status-led off" name="times-circle" scale="1.2" v-if="!(reachableTCP || reachableUDP)"></i>
            </div>
            <div class="col-text">
            <span class="status-label" v-if="(reachableTCP || reachableUDP)">{{$t('RELAY_REACHABLE')}}</span>
            <span class="status-label" v-if="!(reachableTCP || reachableUDP)">{{$t('RELAY_NOT_REACHABLE')}}</span>
            </div>
        </div>
    </div>
</div>
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
        display: flex;
        flex-direction: row;
        align-items: center;
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
