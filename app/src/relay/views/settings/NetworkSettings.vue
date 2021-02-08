<template>
    <div class="network-settings-container">
        <settings-group title="Bandwidth Limit">
            <div slot="help">
                <p>
                    {{$t('SETTINGS_RELAY_NETWORK_HELP_FIRST')}}
                </p>
                <p v-html="$t('SETTINGS_RELAY_NETWORK_HELP_SECOND')">
                </p>
                <p>
                    {{$t('SETTINGS_RELAY_NETWORK_HELP_THIRD')}}
                </p>
            </div>
            <div class="form" slot="body">
                <div class="row m-top-20">
                  <div class="col-xs-9">
                      <label>{{$t('SETTINGS_RELAY_LIMIT_BANDWIDTH')}}</label>
                  </div>
                  <div class="col-xs-3">
                      <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="50" :value="showLimitBandwidth" v-on:change="onLimitBandwidth"></toggle-button>
                  </div>
                </div>
                <div class="row" v-if="showLimitBandwidth">
                    <div class="col-xs-5">
                        <div class="form-group">
                            <label class="control-label">{{$t('UPLOAD_LIMIT')}}</label>
                            <money class="bandwidth-picker" type="text" v-bind="bandwidthInputSettings" v-model="uploadLimit"></money>
                        </div>
                    </div>
                    <div class="col-xs-5 col-xs-offset-2">
                        <div class="form-group">
                            <label class="control-label">{{$t('DOWNLOAD_LIMIT')}}</label>
                            <money class="bandwidth-picker" type="text" v-bind="bandwidthInputSettings" v-model="downloadLimit"></money>
                        </div>
                    </div>
                </div>
            </div>
        </settings-group>
        <div class="settings-divider"></div>
        <settings-group title="NAT Settings">
            <div slot="help">
                <p>...</p>
            </div>
            <div class="form" slot="body">
                <div class="row" v-if="completeVersion">
                    <div class="col-xs-7">
                        <label>{{$t('SETTINGS_RELAY_BEHIND_NAT')}}</label>
                    </div>
                    <div class="col-xs-2">
                        <code>{{ behindNAT ? 'Yes' : 'No'}}</code>
                    </div>
                </div>
                <div class="row" v-if="completeVersion">
                    <div class="col-xs-7">
                        <label>TCP Reachable</label>
                    </div>
                    <div class="col-xs-2">
                        <code>{{ tcpReachable ? 'Yes' : 'No'}}</code>
                    </div>
                </div>
                <div class="row" v-if="completeVersion">
                    <div class="col-xs-7">
                        <label>UDP Reachable</label>
                    </div>
                    <div class="col-xs-2">
                        <code>{{ udpReachable ? 'Yes' : 'No'}}</code>
                    </div>
                </div>
                <div class="row" v-if="completeVersion &amp;&amp; behindNAT">
                    <div class="col-xs-7">
                        <label>{{$t('SETTINGS_RELAY_LOCAL_ADDRESS')}}</label>
                    </div>
                    <div class="col-xs-2">
                        <code>{{ privateAddress.ip }}</code>
                    </div>
                </div>
                <div class="row" v-if="completeVersion">
                    <div class="col-xs-7">
                        <label>{{$t('SETTINGS_RELAY_PUBLIC_ADDRESS')}}</label>
                    </div>
                    <div class="col-xs-2">
                        <code>{{ publicAddress.ip }}</code>
                    </div>
                </div>
                <div class="row" v-if="completeVersion &amp;&amp; !useCustomPort">
                    <div class="col-xs-7">
                        <label>{{$t('SETTINGS_RELAY_PORT')}}</label>
                    </div>
                    <div class="col-xs-2"><code>{{ publicAddress.port }}</code></div>
                </div>
                <div class="row m-top-20">
                    <div class="col-xs-9">
                        <label>{{$t('SETTINGS_RELAY_USE_CUSTOM_PORT')}}</label>
                    </div>
                    <div class="col-xs-3">
                        <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="50" :value="useCustomPort" v-on:change="onUseCustomPortChange"></toggle-button>
                    </div>
                </div>
                <div class="row port-settings m-bot-20" v-show="useCustomPort">
                    <div class="col-xs-6 label-col">
                        <label>Port Number</label>
                    </div>
                    <div class="col-xs-2">
                        <input type="number" v-model="portNumber" min="1025" max="65535" />
                    </div>
                </div>
            </div>
        </settings-group>
    </div>
</template>

<script>
  import SlidedNumberPicker from '@common/widgets/SlidedNumberPicker'
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { Money } from 'v-money'
  import { UNLIMITED_BANDWIDTH } from '@common/constants'
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
    data() {
      return {
        useCustomPort: !this.$store.state.natEnabled,
        showLimitBandwidth: false,
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
      },
    },
    computed: {
      tcpReachable: {
        get () {
          return this.$store.state.isTCPRelayReachable
        }
      },
      udpReachable: {
        get () {
          return this.$store.state.isUDPRelayReachable
        }
      },
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
          let val = Number(this.$store.state.uploadLimit)
          if (val === 0) {
            return UNLIMITED_BANDWIDTH
          }
          return val
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
          let val = Number(this.$store.state.downloadLimit)
          if (val === 0) {
            return UNLIMITED_BANDWIDTH
          }
          return val 
        },
        set (downloadLimit) {
          if (downloadLimit == this.$store.state.downloadLimit) {
            return
          }

          // console.log(`download limit to be set to ${downloadLimit}`)

          let action = () => {
            // console.log(`setting download limit to ${downloadLimit}`)
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
      stepFunction(val) {
        if (val < 1000000) {
          return 10000
        } else {
          return 100000
        }
      },
      onLimitBandwidth (e) {
        this.showLimitBandwidth = e.value
        if (e.value === false) {
          info(`setting upload limit to ${UNLIMITED_BANDWIDTH}`)
            relayManager.setUploadLimit(UNLIMITED_BANDWIDTH)
            relayManager.setDownloadLimit(UNLIMITED_BANDWIDTH)
        }
      },
      async onUseCustomPortChange (e) {
        if (e.value != Boolean(this.$store.state.natEnabled)) {
          return
        }

        // console.log(`Changing nat mode to ${!e.value}`)
        relayManager.changeNatStatus(!e.value, this.completeVersion)

        if (e.value) {
          await showConfirmDialog(
            this.$t('SETTINGS_RELAY_CUSTOM_PORT_MODAL_TITLE'),
            this.$t('SETTINGS_RELAY_CUSTOM_PORT_MODAL_MSG'),
            { yesText: this.$t('SETTINGS_RELAY_CUSTOM_PORT_CONFIRM'), noText: null }
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
