<template lang="pug">
  #m-relay-toggle-box
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
</template>

<script>
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')

  export default {
    store,
    computed: mapState({
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

  #m-relay-toggle-box {
    background: #fcfcfc;

    // padding: 5px 0px 5px 0px;

    .status-box {
      margin: 0px;

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
    }

    .toggle-container {
      display: inline-block;
      position: absolute;
      right: 10px;
    }
    
  }
</style>
