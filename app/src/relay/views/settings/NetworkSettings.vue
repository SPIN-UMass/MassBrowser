<template lang='pug'>
    .network-settings-container
        //- .well.well-sm Select the amount of bandwidth you want to dedicate
        settings-group(title="Bandwidth Limit")
            div(slot="help")
                p Choose how much of your bandwidth you want to enable connected clients to use.
                p The #[strong Upload Limit] is amount of traffic you send towards different websites
                    | and the #[strong Download Limit] is the traffic you receive from websites.
                p If you do not want to put any bandwidth restrictions, enter 0 as the limit.
            .form(slot="body")
                .row
                    .col-xs-5
                        .form-group
                            label.control-label Upload Limit
                            money.bandwidth-picker(type='text' v-bind="bandwidthInputSettings" v-model="uploadLimit")
                    .col-xs-5.col-xs-offset-2
                        .form-group
                            label.control-label Download Limit
                            money.bandwidth-picker(type='text' v-bind="bandwidthInputSettings" v-model="downloadLimit")
        .settings-divider
        settings-group(title="NAT Settings")
            div(slot="help")
                p ...
            .form(slot="body")
                .row(v-if="completeVersion")
                    .col-xs-7
                        label Behind NAT
                    .col-xs-2
                        code {{ behindNAT ? 'Yes' : 'No'}}
                .row(v-if='completeVersion && behindNAT')
                    .col-xs-7
                        label Local Address
                    .col-xs-2
                        code {{ privateAddress.ip }}
                .row(v-if="completeVersion")
                    .col-xs-7
                        label Public Address
                    .col-xs-2
                        code {{ publicAddress.ip }}
                .row(v-if='completeVersion && !useCustomPort')
                    .col-xs-7
                        label Port
                    .col-xs-2
                        code {{ publicAddress.port }}
                .row.m-top-20
                    .col-xs-9
                        label Do you want to use a custom port?
                    .col-xs-3
                        toggle-button.toggle(:labels= {
                          checked: 'Yes',
                          unchecked: 'No'
                        } :width="50" :value="useCustomPort" v-on:change="onUseCustomPortChange")
                .row.port-settings(v-show='useCustomPort').m-bot-20
                    .col-xs-6.label-col
                        label Port Number
                    .col-xs-2
                        input(type='number' v-model='portNumber' min='1025' max='65535')
</template>

<script>
  import SlidedNumberPicker from '@common/widgets/SlidedNumberPicker'
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { Money } from 'v-money'
  import { store } from '@utils/store'
  import { prettyBytes } from '@utils'
  import { getService } from '@utils/remote'
  import { mapState } from 'vuex'
  import { showConfirmDialog } from '@common/utils'
  import { debug, info } from '@utils/log'

  const relayManager = getService('relay')

  let uploadLimitTimeout = null
  let downloadLimitTimeout = null
  let portNumberTimeout = null
  let setActionDelay = 2000

  export default {
    store,
    components: {
      SlidedNumberPicker,
      Money,
      SettingsGroup
    },
    data () {
      return {
        useCustomPort: !this.$store.state.natEnabled,
        bandwidthInputSettings: {
          thousands: ',',
          prefix: '',
          suffix: ' KB/s',
          precision: 0,
          masked: false
        }
      }
    },
    props: {
      completeVersion: {
        type: Boolean,
        default: true
      }
    },
    computed: {
      privateAddress: {
        get () {
          return this.$store.state.privateAddress
        }
      },
      publicAddress: {
        get () {
          return this.$store.state.publicAddress
        }
      },
      behindNAT: {
        get () {
          return this.privateAddress.ip !== this.publicAddress.ip
        }
      },
      portNumber: {
        get () {
          return Number(this.$store.state.TCPRelayPort)
        },
        set (portNumber) {
          if (portNumber == this.$store.state.TCPRelayPort) {
            return
          }

          if (portNumber <= 1024 || portNumber > 65535) {
            return
          }

          let action = () => {
            info(`setting port to ${portNumber}`)
            relayManager.setTCPRelayPort(Number(portNumber), this.completeVersion)
          }

          if (portNumberTimeout != null) {
            clearTimeout(portNumberTimeout)
          }

          portNumberTimeout = setTimeout(action, setActionDelay)
        }
      },
      uploadLimit: {
        get () {
          return Number(this.$store.state.uploadLimit)
        },
        set (uploadLimit) {
          if (uploadLimit == this.$store.state.uploadLimit) {
            return
          }

          debug(`upload limit to be set to ${uploadLimit}`)

          let action = () => {
            info(`setting upload limit to ${uploadLimit}`)
            relayManager.setUploadLimit(Number(uploadLimit))
          }

          if (uploadLimitTimeout != null) {
            clearTimeout(uploadLimitTimeout)
          }

          uploadLimitTimeout = setTimeout(action, setActionDelay)
        }
      },
      downloadLimit: {
        get () {
          return Number(this.$store.state.downloadLimit)
        },
        set (downloadLimit) {
          if (downloadLimit == this.$store.state.downloadLimit) {
            return
          }

          console.log(`download limit to be set to ${downloadLimit}`)

          let action = () => {
            console.log(`setting download limit to ${downloadLimit}`)
            relayManager.setDownloadLimit(Number(downloadLimit))
          }

          if (downloadLimitTimeout != null) {
            clearTimeout(downloadLimitTimeout)
          }

          downloadLimitTimeout = setTimeout(action, setActionDelay)
        }
      }
    },
    methods: {
      byteFormatter (bytes) {
        if (!bytes) {
          return '∞'
        }
        return prettyBytes(bytes) + '/s'
      },
      slideStepper (val) {
        if (val < 0) {
          return - Math.pow(2, -val) * 1000
        }
        return Math.pow(2, val) * 1000
      },
      stepFunction (val) {
        if (val < 1000000) {
          return 10000
        } else {
          return 100000
        }
      },
      async onUseCustomPortChange (e) {
        if (e.value != Boolean(this.$store.state.natEnabled)) {
          return
        }

        console.log(`Changing nat mode to ${!e.value}`)
        relayManager.changeNatStatus(!e.value, this.completeVersion)

        if (e.value) {
          await showConfirmDialog(
            'Are you sure?',
            'You should only use custom port settings if you are not located behind a NAT network.',
            { yesText: 'I Understand', noText: null }
          )
        }

        this.useCustomPort = e.value
      }
    }
  }

</script>

<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    .network-settings-container {
        overflow: auto;
        height: $content-height - 20px;

        padding: 0 10px;
        .control-label {
            font-weight: bold;
            font-size: 11px;
        }

        .bandwidth-picker {
            height: 28px;
            width: 120px;
            margin-top: 5px;
            text-align: center;
        }

        .port-settings {
            margin-top: 10px;
            .label-col {
                label {
                    font-weight: bold;
                }
                text-align: left;
            }

            input {
                width: 130px;
                height: 28px;
                text-align: center;
            }
        }
        .m-top-20 {
            margin-top: 20px;
        }

        .m-bot-20 {
            margin-bottom: 20px;
        }

        .settings-divider {
            border-bottom: 1px solid rgba(50, 50, 50, 0.2);
            margin: 5px 0 15px 0;
        }
    }
</style>
