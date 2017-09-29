<template lang="pug">
  .y-browser-integration
      .text-center
        h1.title Browser Configuration
        p.message Please visit the link below in Firefox to configure you're browser      
      .text-center.link-container
        code.link(v-on:click="openLink") http://{{webDomain}}
</template>

<script>
  import config from '@utils/config'
  import { shell } from 'electron'
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapGetters } from 'vuex'

  const context = getService('context')


  export default {
    store,
    data () {
      return {
        webDomain: config.web.domain
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
      openLink() {
        shell.openExternal(`http://${this.webDomain}`)
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  .y-browser-integration{
    background: white;
    min-height: 100%;

    .title {
      margin-top: 0px;
      padding-top: 50px;
    }

    .message {
      margin-top: 50px;
    }

    .link-container {
      margin-top: 50px;
      code.link {    
        padding: 20px;
        font-size: 20px;
        color: rgb(150, 100, 100);
        cursor: pointer;
        .link-text {
          
        }
      }
    }
    
  }
  
</style>
