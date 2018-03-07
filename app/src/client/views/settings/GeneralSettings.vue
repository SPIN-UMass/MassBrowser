<template lang='pug'>
  .general-settings-container
    settings-group(title="Application Settings")
      div(slot="help")
        p
      div(slot="body")
        .row(v-if="errorMessage")
          .col-xs-12
            .alert.alert-pink.err-message
              p {{ errorMessage }}
        .row
          .col-xs-8
            label Launch MassBuddy on startup
          .col-xs-4.align-right
            toggle-button.toggle(:labels= {
            checked: 'Yes',
            unchecked: 'No'
            } :width="60" :sync="true" v-model="autoLaunchEnabled" v-on:change="autoLaunchChanged")
        .row(v-if="showDockHideOption")
          .col-xs-8
            label Show dock icon when closed
          .col-xs-4.align-right
            toggle-button.toggle(:labels= {
            checked: 'Yes',
            unchecked: 'No'
            } :width="60" :sync="true" v-model="dockVisible" v-on:change="dockVisibleChanged")

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
      async autoLaunchChanged(e) { 
        const isEnabled = await autoLauncher.isEnabled()
        if (e.value && !isEnabled) {
          await autoLauncher.enable()
          if (!(await autoLauncher.isEnabled())) {
            this.showError("Unable to configure launch on startup, it may not be supported on your system.")
          }
        } else if (!e.value && isEnabled) {
          await autoLauncher.disable()
          if (await autoLauncher.isEnabled()) {
            this.showError("Unable to configure launch on startup, it may not be supported on your system.")
          }
        }
      },
      async dockVisibleChanged(e) {
        dockHider.changeVisibility(e.value)
      },
      showError(message) {
        this.errorMessage = message
      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .general-settings-container {
    padding: 0px 0px;

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
