<template lang="pug">
  .y-browser-integration
    .dragger
    .text-center
      h1.title {{$t("BROWSER_CONFIGURATION_TITLE")}}
      p.message {{$t("BROWSER_CONFIGURATION_LINK_MSG")}}
    .text-center.link-container
      code.link(v-on:click="openLink") http://{{webDomain}}:{{webPanelPort}}
    .text-center.alert.alert-danger.error-container(v-if="error") {{error}}

</template>

<script>
  import config from '@utils/config'
  import { shell } from 'electron'
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapGetters } from 'vuex'
  // import child_process from 'child_process'
  import opn from 'opn'
  const context = getService('context')

  export default {
    store,
    data () {
      return {
        webDomain: 'localhost', //config.web.domain,
        webPanelPort: config.web.port,
        error: ''
      }
    },
    created() {
      let self = this
      this.$store.watch(state => state.browserIntegrationComplete, () => {
        self.finish()
      })
    },
    methods: {
      finish () {
        this.$router.push('/client')
      },
      async openLink () {
        try {
          await opn(`http://${this.webDomain}:${this.webPanelPort}`, {app: 'firefox'})
        } catch (e) {
          this.error = this.$t('ERROR_NOT_FIREFOX')
        }
        // child_process.execSync(`open -a Firefox http://${this.webDomain}`)
        // shell.openExternal(`http://${this.webDomain}`)
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  .y-browser-integration{
    background: white;
    min-height: 100%;

    .dragger {
      -webkit-app-region: drag;
      position: fixed;
      height: 50px;
      width: 100%;
      top: 0;
    }

    .title {
      margin-top: 0;
      padding-top: 50px;
    }

    .message {
      margin-top: 25px;
    }

    .link-container {
      margin-top: 40px;
      code.link {
        padding: 20px;
        font-size: 20px;
        color: rgb(150, 100, 100);
        cursor: pointer;
        .link-text {

        }
      }
    }

    .error-container {
      margin-top: 40px;
      color:white;
      font-size: 16px;
      padding: 0 60px;
      border: none;
    }

  }

</style>
