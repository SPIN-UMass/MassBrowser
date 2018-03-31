<template lang="pug">
  #m-container
    #m-header
      h1 MassBrowser
      #m-nav
        ul
          li(:class="{active: currentTab==='home'}")
            router-link(to='/client') home
          //- li(:class="{active: currentTab==='websites'}")
          //-   router-link(to='/client/websites') websites
          li(:class="{active: currentTab==='feedback'}")
            router-link(to='/client/feedback') feedback
          li(:class="{active: currentTab==='settings'}")
            router-link(to='/client/settings') settings
            //- .span(v-on:click="$router.push('client-websites')") websites
          //- li(:class="{active: currentTab==='client-settings'}")
          //-   a() settings
    #m-content
      router-view
    #m-footer
      StatusWidget.status-bar
      .version v{{version}}
      //- button.btn.btn-sm.btn-success(v-on:click="$router.push('client-splash')" ) Open Browser
</template>

<script>
  import StatusWidget from '@common/widgets/StatusWidget'
  import { getService } from '@utils/remote'
  import config from '@utils/config'

  const syncService = getService('sync')
  const autoUpdater = getService('autoupdate')
  
  export default {
    data () {
      return {
        currentTab: '',
        version: config.version
      }
    },
    components: {
      StatusWidget
    },
    created () {
      this.currentTab = this.$router.currentRoute.name
      this.$router.afterEach((to, from) => {
        this.currentTab = to.name
      })

      syncService.syncAll()
      autoUpdater.checkForUpdates()
    }
  }
</script>


<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';


  $title_font_size: 20px;
  $nav_font_size: 16px;

  #m-container {
    height: $application_height;
  }

  #m-header {
    border-radius: $application_border_radius $application_border_radius 0 0;
    background: $color_main;
    height: $header_height;
    -webkit-app-region: drag;
    
    h1 {
      position: absolute;
      left: 0px;
      top: $header_height / 2 - $title_font_size / 2;

      margin: 0px;
      padding: 5px 30px;

      font-size: 20px;
      color: #999;
      font-weight: bold;
      font-family: $font_title;
    }
  }

  #m-nav {
    position: absolute;
    right: 0px;
    top: $header_height / 2 - $nav_font_size / 2;

    font-family: $font-menu;
    overflow: auto;
    // float: right;
    ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
    }
  
    li {
      // float: left;
      display: inline-block;
      
      a {
        display: block;
        text-align: center;
        padding: 5px 16px;
        text-decoration: none;
        
        color: #bbb;    
        font-size: $nav_font_size;
        
        &:hover {
          color: #111;
        }    
      }
      
      &.active {
        a{
          color: #555;
          font-weight: bold;
        }
      }
    }
  }

  #m-content {
    height: $content_height;

    clear: both;
    background: #f1f4f7;
    box-shadow: 0 -1px 0 0 rgba(0,0,0,0.1);
  }

  #m-footer {
    height: $footer_height;

    clear: both;
    
    border-radius: 0 0 $application_border_radius $application_border_radius;
    background: $color-main;
    box-shadow: 0px -1px 0 0 rgba(0, 0, 0, 0.1);
    
    .status-bar {
      float: left;
      margin-top: 6px;
      margin-left: 15px;
      font-size: 10px;
      color: #aaa;
    }

    .version {
      font-size: 8px;
      color: #aaa;
      float: right;
      padding: 8px 12px;
    }
  }


</style>
