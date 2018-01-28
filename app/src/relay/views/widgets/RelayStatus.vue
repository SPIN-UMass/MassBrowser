<template lang="pug">
  #m-relay-status
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
  import { store } from '@utils/store'
  import { mapState } from 'vuex'


  export default {
    store,
    computed: mapState({
      reachable: 'isRelayReachable',
      connected: 'isServerConnected',
    }),
  }
</script>

<style scoped lang='scss'>
  @import '~@common/styles/settings.scss';

  #m-relay-status {
    background: #fcfcfc;

    padding: 5px 0px;

    .status-container {
      padding: 0px 20px;
      .row-stat {
        margin-top: 15px;

        .col-led {
          text-align: right;

          .status-led {
            vertical-align: middle;
            display: inline-block;
            width: 20px;
            height: 15px;
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
