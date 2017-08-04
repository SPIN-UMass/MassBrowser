<template lang="pug">
  .y-browser-integration
      .text-center
        h1.title Browser Configuration
        p.message Please visit the link below in your prefered browser to configure you're browser      
      .text-center.link-container
        code.link(v-on:click="openLink") http://{{webDomain}}
</template>

<script>
  import config from '~/utils/config'
  import { shell } from 'electron'
  import KVStore from '~/utils/kvstore'

  export default {
    data () {
      return {
        webDomain: config.client.web.domain
      }
    },
    mounted() {
      this.listener = () => {
        this.$router.push('/client')
      }

      KVStore.on('browser-integration-completed', this.listener)
    },
    unmounted() {
      KVStore.remoteListener('browser-integration-completed', this.listener)
    },
    methods: {
      openLink() {
        shell.openExternal(`http://${this.webDomain}`)
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@common/styles/settings.scss';

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
