<template lang="pug">
    #m-splash
        .dragger
        #m-container
            h1 {{ appName }}
            .loading-container(v-if="step=='loading'")
                GridLoader.spinner(color="#aaa")
                .status-container  {{ status }}
            .error-container(v-if="step=='error'")
                h4.red {{ errorMessage }}
                div
                    button#retry-btn.btn.btn-rounded.btn-warning(v-if="canRetry" v-on:click='boot') Try Again
</template>

<script>
  import GridLoader from 'vue-spinner/src/GridLoader.vue'

  import { ApplicationBootError } from '@utils/errors'
  import { getService } from '@utils/remote'
  import { STATUS_LOG, STATUS_PROGRESS} from '@common/services/statusManager'
  import { store } from '@utils/store'
  import config from '@utils/config'

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
        canRetry: false,
        appName: config.role == 'relay' ? 'MassBuddy' : 'MassClient'
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
      this.boot()
    },
    methods: {
      boot() {
        return Boot.boot()
          .then(() => this.$router.push('/'))
          .catch(err => {
            if (err instanceof ApplicationBootError) {
              this.errorMessage = err.message
              this.step = 'error'
              this.canRetry = true
            } else {
              throw err
            }
          })
      }
    }
  }
</script>


<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    #m-splash {
        background-color: white;
        height: 100%;
        padding-top: 50px;

        .dragger {
            -webkit-app-region: drag;
            position: fixed;
            height: 50px;
            width: 100%;
            top: 0;
        }

        #m-container {
            text-align: center;
        }

        h1 {
            font-family: $font_title;
            font-size: 36px;
            color: #94132a;
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
            padding: 0px 50px;
            #retry-btn {
                margin-top: 30px;
                padding: 10px 50px 30px 50px;
            }
        }
    }


</style>
