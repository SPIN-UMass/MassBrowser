<template lang="pug">
  #m-home
    #m-relay-toggle-box
      .alert.alert-primary.status-box.running(v-if='openAccess')
        h4 You can close this window now! 
        p.de-emph #[strong MassBuddy] will continue running in the background.
        p.de-emph You can also change your #[router-link(to='/relay/settings').action-link Settings] give us 
          | #[router-link(to='/relay/feedback').action-link Feedback] or 
          | #[span.action-link(v-on:click="onChange(false)") Stop MassBuddy].
      .alert.alert-danger.status-box.not-running(v-if='!openAccess')
        h4 #[strong MassBuddy] is not running! 
        p.de-emph You are disconnected from the MassBrowser network
        p.de-emph To start allowing client connections, #[span.action-link(v-on:click="onChange(true)") Start MassBuddy].
    RelayStatus.relay-status
    div.access-toggle-btn-container
      button.btn.btn-danger(v-if="openAccess" v-on:click='onChange(false)') Stop MassBuddy
      button.btn.btn-success(v-if="!openAccess" v-on:click='onChange(true)') Start MassBuddy
</template>

<script>
  import MapView from './widgets/MapView'
  import RelayStatus from './widgets/RelayStatus'
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')
  
  export default {
    store,
    computed: mapState({
      openAccess: 'openAccess'
    }),
    components: {
      MapView,
      RelayStatus,
    },
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
  @import '~@/views/styles/settings.scss';
  
  #m-home{
    height: $content_height;
    position: relative;
    border-bottom: 1px solid #dadada;
    background: white;

    #m-relay-toggle-box {
      background: #fcfcfc;
      .action-link {
        cursor: pointer;
        color: white;
        font-weight: bold;
        &:hover {
          color: orange;
        }
      }

      .de-emph {
        color: rgb(220, 220, 220);
      }

      .status-box {
        margin: 0px;

        border-left: none;
        .title {
          font-size: 16px;
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
      }

      .toggle-container {
        display: inline-block;
        position: absolute;
        right: 10px;
      }
      
    }

    .map {
      height: 25%;
      box-shadow: 0 -1px 0 0 rgba(0,0,0,.1);
    }

    
    .relay-status {
      //  height: 50%;
    }

    .access-toggle-btn-container {
      // margin-top: 10px;
      padding: 20px;
      text-align: right;
    }
  }
  
</style>
