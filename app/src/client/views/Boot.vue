<template lang="pug">
  .y-splash
    .y-container
      h1 MassBrowser
      .loading-container(v-if="step=='loading'")
        GridLoader.spinner(color="#aaa")
        .status-container  {{ status }}
      .error-container(v-if="step=='error'")
        h4.red {{ errorMessage }}
        div
          button.btn.btn-rounded.btn-lg.btn-warning(v-if="canRetry" v-on:click='bootClient') Try Again
</template>

<script>
  // import StatusWidget from './StatusWidget'
  import GridLoader from 'vue-spinner/src/GridLoader.vue'

  import { ApplicationBootError } from '@utils/errors'
  import { getService } from '@utils/remote'
  import { STATUS_LOG, STATUS_PROGRESS} from '@common/services/StatusService'
  import { store } from '@utils/store'

  const Boot = getService('boot')

  export default {
    components: {
      GridLoader
    },
    store,
    data () {
      return {
        step: 'loading',
        errorMessage: '',
        canRetry: false
      }
    },
    computed: {
      status: function() {
        let status = this.$store.state.status
        if (status.statusType === STATUS_LOG) {
          return status.message
        } else if (status.statusType === STATUS_PROGRESS) {
          return status.message
        } else {
          return ''
        }
      }
    },
    created () {
      this.bootClient()
    },
    methods: {
      bootClient() {
        return Boot.bootClient()
        .then(() => this.$router.push('/'))
        .catch(ApplicationBootError, err => {
          this.errorMessage = err.message
          this.step = 'error'
          this.canRetry = true
        })
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
      font-size: 36px;
      margin-top: 0px;
    }

    .loading-container {
      margin-top: 50px;
      
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
