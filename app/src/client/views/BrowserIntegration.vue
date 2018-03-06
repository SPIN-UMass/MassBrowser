<template lang="pug">
  .y-browser-integration
    .dragger
    .text-center
      h1.title Browser Configuration
      p.message Please visit the link below in Firefox to configure you're browser      
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
        webDomain: '127.0.0.1', //config.web.domain,
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
      finish() {
        this.$router.push('/client')
      },
      async openLink() {
        try {
          await opn(`http://${this.webDomain}:${this.webPanelPort}`, {app: 'firefox'})
        } catch(e) {
          this.error = "Currently only the Firefox browser is supported. Please install Firefox to continue"
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
      margin-top: 0px;
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
      padding: 0px 60px;
      border: none;
    }
    
  }
  
</style>
