<template lang='pug'>
  .settings-container
    .tab-base.tab-stacked-left
      ul.nav.nav-tabs
        li(v-bind:class="{ active: currentTab === 'settings-network' }")
          router-link(to='/relay/settings/network') 
            i.tab-icon.fa.fa-signal
            span.tab-label Network
        li(v-bind:class="{ active: currentTab === 'settings-acl' }")
          router-link(to='/relay/settings/acl')
            i.tab-icon.fa.fa-key
            span.tab-label Categories
      .tab-content
        router-view.tab-pane.fade.active.in
          
        
</template>

<script>
  import { store } from '@utils/store'
  
  export default {
    store,
    data () {
      return {
        currentTab: 'settings-network'
      }
    },
    created() {
      this.$router.afterEach((to, from) => {
        this.currentTab = to.name
      })
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .settings-container {
    .nav.nav-tabs {
      width: 28%;
    }

    .tab-icon {
      font-size: 1.2em;
      margin-right: 10px;
      color: #888;
    }

    .tab-label {
      font-size: 14px;
    }

    .tab-content {
      height: $content_height;
    }
  }
</style>
