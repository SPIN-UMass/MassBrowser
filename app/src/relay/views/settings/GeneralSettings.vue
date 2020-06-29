<template>
    <div class="general-settings-container">
        <settings-group :title="$t('SETTINGS_RELAY_GENERAL_SETTING_TITLE')">
            <div slot="help">
                <p></p>
            </div>
            <div slot="body">
                <div class="row" v-if="errorMessage">
                    <div class="col-xs-12">
                        <div class="alert alert-pink err-message">
                            <p>{{ errorMessage }}</p>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-8"><label>{{$t('SETTINGS_RELAY_STARTUP')}}</label></div>
                    <div class="col-xs-4 align-right">
                        <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="60" :sync="true" v-model="autoLaunchEnabled" v-on:change="autoLaunchChanged"></toggle-button>
                    </div>
                </div>
                <div class="row" v-if="showDockHideOption">
                    <div class="col-xs-8"><label>{{$t('SETTINGS_RELAY_SHOW_DOCK')}}</label></div>
                    <div class="col-xs-4 align-right">
                        <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="60" :sync="true" v-model="dockVisible" v-on:change="dockVisibleChanged"></toggle-button>
                    </div>
                </div>
            </div>
        </settings-group>
    </div>
</template>

<script>
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
  import { isPlatform, OSX } from '@utils'

  const autoLauncher = getService('autoLaunch')
  const dockHider = getService('dockHider')

  export default {
    store,
    components: {
      SettingsGroup
    },
    data () {
      return {
        errorMessage: '',
        autoLaunchEnabled: this.$store.state.autoLaunchEnabled,
        showDockHideOption: isPlatform(OSX),
        dockVisible: this.$store.state.dockIconVisible
      }
    },
    async created() {
      this.autoLaunchEnabled = await autoLauncher.isEnabled()
    },
    methods: {
      async autoLaunchChanged (e) {
        const isEnabled = await autoLauncher.isEnabled()
        if (e.value && !isEnabled) {
          await autoLauncher.enable()
          if (!(await autoLauncher.isEnabled())) {
            this.showError(this.$t('ERROR_UNABLE_TO_CONFIGURE_LAUNCH_STARTUP'))
          }
        } else if (!e.value && isEnabled) {
          await autoLauncher.disable()
          if (await autoLauncher.isEnabled()) {
            this.showError(this.$t('ERROR_UNABLE_TO_CONFIGURE_LAUNCH_STARTUP'))
          }
        }
      },
      async dockVisibleChanged (e) {
        dockHider.changeVisibility(e.value)
      },
      showError (message) {
        this.errorMessage = message
      }
    }
  }

</script>

<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    .general-settings-container {
        padding: 0 0;

        .align-right {
            text-align: right;
        }

        .align-center {
            text-align: center;
        }

        .err-message {
            font-size: 12px;
            margin-bottom: 5px;
            padding: 5px;
        }
    }
</style>
