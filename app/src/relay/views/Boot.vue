<template lang="pug">
  .y-splash
    .y-container
      h1 MassProxy
      .loading-container(v-if="status=='loading'")
        GridLoader.spinner(color="#aaa")
        .status-container  {{ statusMessage }}
      .error-container(v-if="status=='error'")
        h4.red {{ errorMessage }}
        div
          button.btn.btn-rounded.btn-lg.btn-warning(v-if="canRetry" v-on:click='bootRelay') Try Again
</template>

<script>
  // import StatusWidget from './StatusWidget'
  // import Status from '@utils/status'
  import GridLoader from 'vue-spinner/src/GridLoader.vue'

  // import bootRelay from '@/boot'
  import { InvalidInvitationCodeError, ApplicationBootError } from '@utils/errors'
  import KVStore from '@utils/kvstore'
  import config from '@utils/config'

  import { getService } from '@utils/remote'

  const Status = getService('status')
  const Context = getService('context')

  const INVITATION_CODE_LENGTH = 10
  const DELIM = '  '

  var invitationCodePromiseResolve = null
  export default {
    data () {
      return {
        status: 'loading',
        errorMessage: '',
        canRetry: false,
        statusMessage: ''
      }
    },
    components: {
      GridLoader
    },
    created () {
      Status.on('status-changed', this.onStatusChanged)
      Status.on('status-cleared', this.onStatusCleared)
      Context.on('boot-finished', this.onBootFinished)
      Context.hasBooted.then(booted => booted ? this.onBootFinished() : '')
    },
    beforeDestroy () {
      Status.removeListener('status-changed', this.onStatusChanged)
      Status.removeListener('status-cleared', this.onStatusCleared)
      Context.removeListener('boot-finished', this.onBootFinished)
    },
    methods: {
      onStatusChanged: function(status) {
        if (status.statusType === Status.STATUS_LOG) {
          this.statusMessage = status.message
        }
      },
      onStatusCleared: function () {
        this.statusMessage = ''
      },
      onBootFinished: function() {
        this.$router.push({path: '/relay'})

        //   .catch(ApplicationBootError, err => {
        //     this.errorMessage = err.message
        //     this.status = 'error'
        //     this.canRetry = err.retriable
        //   })
        // }
      }
    }
  }
</script>


<style scoped lang='scss'>
  @import '~@common/styles/settings.scss';

  .y-splash {
    background-color: white;
    height: 100%;
    padding-top: 50px;

    .y-container {
      text-align: center;  
    }

    h1 {
      font-family: $font_title;
      font-size: 48px;
      margin-top: 0px;
    }

    .loading-container {
      margin-top: 80px;
      
      .spinner { 
        margin: auto;
      }

      .status-container {
        margin-top: 40px;
        font-size: 16px;
      }  
    }

    .invitation-container {
      margin-top: 60px;
      
      input {
        margin-top: 20px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        padding: 9px 0px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .btn {
        margin-top: 40px;
        padding: 10px 80px;
      }
    }
    .error-container {
      margin-top: 60px;
      
      .btn {
        margin-top: 40px;
        padding: 10px 80px;
      }
    }
  }
  
  
</style>
