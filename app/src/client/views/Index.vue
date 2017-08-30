<template lang="pug">
  #m-container
    #m-header
      h1 MassBrowser
      #m-nav
        ul
          li(:class="{active: currentTab==='client-home'}")
            router-link(to='/client') home
          li(:class="{active: currentTab==='client-websites'}")
            router-link(to='/client/websites') websites
            //- .span(v-on:click="$router.push('client-websites')") websites
          //- li(:class="{active: currentTab==='client-settings'}")
          //-   a() settings
    #m-content
      router-view
    #m-footer
      StatusWidget.status-bar
      //- button.btn.btn-sm.btn-success(v-on:click="$router.push('client-splash')" ) Open Browser
</template>

<script>
  import StatusWidget from '@common/widgets/StatusWidget'
  import { getService } from '@utils/remote'

  const SyncService = getService('sync')
  const AutoUpdater = getService('autoupdate')
  
  export default {
    data () {
      return {
        currentTab: ''
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

      SyncService.syncAll()
      AutoUpdater.checkForUpdates()
    }
  }
</script>


<style scoped lang='scss'>
  @import '~@/styles/settings.scss';

  // $border_radius: 0px;
  // $header_height: 75px;
  // $middle_height: 250px;
  // $bottom_height: 255px;
  // $footer_height: 60px;

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
          color: black;
          font-size: 19px;
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
    
    .btn {
      float: right;
      margin-top: 15px;
      margin-right: 20px;
    }
    
    .status-bar {
      float: left;
      margin-top: 20px;
      margin-left: 30px;
      
      color: #aaa;
    }
  }


</style>
