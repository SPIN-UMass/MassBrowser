<template lang="pug">
  .start-page-container
    .dragger
    .start-header
      i.fa.fa-arrow-left.i-nav.i-prev(v-if="prevEnabled" v-on:click="prevPage")
      h1 {{ appName }}
      i.fa.fa-arrow-right.i-nav.i-next(v-if="nextEnabled" v-on:click="nextPage")
    .start-content
      .s-start(v-if="page == 'start'")
        .well
          p #[strong Hey there!] Thanks for using #[strong {{ appName }}].
          p Since it's your first time, lets walk through a few things.
        button.btn.btn-info(v-on:click="nextPage") Start
      .s-sync(v-if="page == 'sync'")
        .well 
          p First, we need to sync your local database with our servers.
          p Click the button below to start syncing.
        button.btn.btn-info(v-on:click="startSync" v-if="sync.state==''") Start Download
        .progress(v-if="sync.state=='downloading'")
          .progress-bar.progress-bar-info(ref="syncProgress")
        p(v-if="sync.state=='done'") Cick on the #[span #[i.fa.fa-arrow-right]] icon in the top right corner to continue
        //- button.btn.btn-success(v-on:click="nextPage" v-if="sync.state=='done'") Continue
      .s-network-settings(v-if="page == 'network-settings'")
        .well.well-sm Customize your #[strong Network Settings] here. Click on #[span #[i.fa.fa-question-circle]] for help.
          br
          | All settings can also be changed again later on.
        network-settings
      .s-category-settings(v-if="page == 'category-settings'")
        .well.well-sm 
          | Select which types of websites you want to allow users to browser through you. Scroll down to see all options.
        category-settings(title='' :syncUpdates="false")
      .s-final(v-if="page == 'final'")
        .well You're all set. Click the button below to continue to {{ appName }}
        button.btn.btn-success(v-on:click="finish") Continue

      
</template>

<script>
  import { store } from '@utils/store'
  import { mapState } from 'vuex' 
  import config from '@utils/config'
  import NetworkSettings from '@/views/settings/NetworkSettings'
  import CategorySettings from '@/views/settings/CategorySettings'
  import { getService } from '@utils/remote'

  const syncService = getService('sync')
  const registrationService = getService('registration')
  
  const pages = [
    'start',
    'sync',
    'network-settings',
    'category-settings',
    'final'
  ]

  const pageConfig = {
    'start': { next: false, prev: false},
    'sync': { next: false, prev: false},
    'network-settings': { next: true, prev: false },
    'category-settings': { next: true, prev: true },
    'final': { next: false, prev: true},
  }

  export default {
    store,
    data () {
      return {
        appName: config.appName,
        page: 'start',
        nextEnabled: false,
        prevEnabled: false,
        sync: {
          state: ''
        }
      }
    },
    computed: mapState({
      syncProgress: 'syncProgress'
    }),
    watch: {
      syncProgress(val) {
        if (this.$refs.syncProgress) {
          this.$refs.syncProgress.style.width = `${val}%`
        }
      }
    },
    components: {
      NetworkSettings,
      CategorySettings
    },
    created () {
    },
    methods: {
      changePage(pageNumber) {
        let bConfig = pageConfig[this.page]
        
        if (bConfig.onLeave) {
          bConfig.onLeave(this)
        }

        this.page = pages[pageNumber]
        let pConfig = pageConfig[this.page]
        this.nextEnabled = pConfig.next
        this.prevEnabled = pConfig.prev
      },
      nextPage() {
        this.changePage(pages.indexOf(this.page) + 1)
      },
      prevPage() {
        this.changePage(pages.indexOf(this.page) - 1)
      },
      async finish() {
        await registrationService.registerRelay()
        this.$router.push('/')
      },
      async startSync() {
        this.sync.state = 'downloading'
        await syncService.syncAll()
        setTimeout(() => {
          this.sync.state = 'done'
          this.nextEnabled = true
        }, 800)
      }
    }
  }
</script>


<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  $title_font_size: 20px;
  $nav_font_size: 16px;

  .start-page-container {
    height: $application_height;
    padding: 30px;
    background-color: #fafafa;

    .dragger {
      -webkit-app-region: drag;
      position: fixed;
      height: 50px;
      width: 100%;
      top: 0;
    }

    .start-header {
      text-align: center;

      h1 {
        font-family: $font_title;
        font-size: 28px;
        margin-top: 0px;
      }

      .i-nav {
        font-size: 34px;
        position: fixed;
        top: 25px;
        color: #ccc;
        cursor: pointer;
        &.i-next {  
          right: 40px;
        }
        &.i-prev {
          left: 40px;
        }
        &:hover {
          color: #999;
        }
        &:active {
          color: #555;
        }
      }
    }

    .start-content {
      
    }

    .s-start {
      padding: 30px;
      text-align: center;

      button {
        width: 150px;
        height: 40px;
        font-size: 16px;
        margin-top: 15px;
      }
    }

    .s-sync {
      padding: 10px;
      text-align: center;

      button {
        font-size: 14px;
        margin-top: 30px;
        width: 150px;
        height: 40px;
      }

      .progress {
        width: 80%;
        margin: auto;
        margin-top: 60px;
      }
    }

    .s-network-settings {
      .well {
        text-align: center;
      }
    }

    .s-category-settings {
      .well {
        text-align: center;
        margin-bottom: 5px;
      }      
    }

    .s-final {
      text-align: center;
      .well {
        margin-top: 20px;
      }
      .btn {
        margin-top: 20px;
        width: 170px;
        height: 40px;
      }
    }
  }

  .ml50 {
    margin-left: 50px;
  }
      
  .mu20 {
    margin-top: 20px;
  }
</style>
