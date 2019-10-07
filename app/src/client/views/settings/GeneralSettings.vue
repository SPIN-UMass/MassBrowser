<template lang='pug'>
    <div class="general-settings-container">
        <settings-group title="Application Settings">
            <div slot="help">
            </div>
            <div slot="body">
                <div class="row" v-if="errorMessage">
                    <div class="col-xs-12">
                        <div class="alert alert-pink err-message">
                            <p>{{ errorMessage }}</p>
                        </div>
                    </div>
                </div>
                <div class="row" v-if="initMessage && !errorMessage">
                    <div class="col-xs-12">
                        <div class="alert alert-info">
                            <p>{{ initMessage }}</p>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{$t("SETTINGS_GENERAL_STARTUP")}}</label>
                    </div>
                    <div class="col-xs-6 align-right">
                        <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="60" :sync="true" v-model="autoLaunchEnabled" v-on:change="autoLaunchChanged"></toggle-button>
                    </div>
                </div>
                <div class="row" v-if="showDockHideOption">
                    <div class="col-xs-6">
                        <label>{{$t("SETTINGS_GENERAL_SHOW_DOCK")}}</label>
                    </div>
                    <div class="col-xs-6 align-right">
                        <toggle-button class="toggle" :labels="{&quot;checked&quot;:&quot;Yes&quot;,&quot;unchecked&quot;:&quot;No&quot;}" :width="60" :sync="true" v-model="dockVisible" v-on:change="dockVisibleChanged"></toggle-button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>Language Setting</label>
                    </div>
                    <div class="col-xs-6 align-right">
                        <v-select v-model="language" v-on:input="languageChanged" :clearable="false" label="label" :options="this.languagesList" :searchable="true">
                        </v-select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>Country Setting</label>
                    </div>
                    <div class="col-xs-6 align-right">
                        <v-select v-model="country" v-on:input="countryChanged" :clearable="false" :options="['United States', 'Iran', 'China']" :searchable="true">
                        </v-select>
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
        initMessage: '',
        autoLaunchEnabled: this.$store.state.autoLaunchEnabled,
        showDockHideOption: isPlatform(OSX),
        dockVisible: this.$store.state.dockIconVisible,
        language: {value: this.$store.state.language, label: this.$i18n.messages[this.$store.state.language].nativeName},
        country: this.$store.state.country,
        languagesList: []
      }
    },
    async created () {
      this.autoLaunchEnabled = await autoLauncher.isEnabled()
      this.initMessage = ''
      if (!this.$store.state.languageAndCountrySet) {
        this.showFirstTime('Please indicate your preferred language and country')
        store.commit('setLanguageAndCountry')
      }
      this.languagesList = this.$i18n.availableLocales.map(x => ({value: x, label: this.$i18n.messages[x].nativeName}))
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
      async languageChanged (e) {
        store.commit('changeLanguage', e.value)
        this.$i18n.locale = e.value
      },
      async countryChanged (e) {
        store.commit('changeCountry', e)
      },
      async dockVisibleChanged (e) {
        dockHider.changeVisibility(e.value)
      },
      showError (message) {
        this.errorMessage = message
      },
      showFirstTime (message) {
        this.initMessage = message
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
