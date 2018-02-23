<template lang='pug'>
  .general-settings-container
    settings-group(title="Launch Settings")
      div(slot="help")
        p
      div(slot="body")
        .row
          .col-xs-8
            label Launch MassBuddy on startup
          .col-xs-4.align-right
            toggle-button.toggle(:labels= {
            checked: 'Yes',
            unchecked: 'No'
            } :width="60" :sync="true" v-model="autoLaunchEnabled" v-on:change="autoLaunchChanged")
        .row(v-if="errorMessage")
          .col-xs-12
            .alert.alert-pink.err-message
              p {{ errorMessage }}

</template>

<script>
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
import { setTimeout } from 'timers';

  const autoLauncher = getService('autoLaunch');

  // let autoLaunchEnabled = false

  export default {
    store,
    components: {
      SettingsGroup
    },
    data () {
      return {
        autoLaunchEnabled: false,
        errorMessage: ''
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
            this.showError()
          }
        } else if (!e.value && isEnabled) {
          await autoLauncher.disable()
          if (await autoLauncher.isEnabled()) {
            this.showError()
          }
        }
      },
      showError() {
        this.errorMessage = "Unable to configure launch on startup, it may not be supported for you."
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
      // background-color: #ff9393;
      margin-top: 5px;
      // border: none;
      padding: 5px;
    }
  }
</style>
