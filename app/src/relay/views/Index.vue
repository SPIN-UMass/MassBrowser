<template lang="pug">
    .y-container
        .y-header
            h1 Yaler
            .y-nav
                ul
                    li(:class="{active: currentTab==='relay-home'}")
                        router-link(to='/relay') home
                    li(:class="{active: currentTab==='relay-categories'}")
                        router-link(to='/relay/categories') ACL
                        //- .span(v-on:click="$router.push('client-websites')") websites
                    li(:class="{active: currentTab==='relay-settings'}")
                        router-link(to='/relay/settings') settings
        .y-content
            router-view
        .y-footer
            StatusWidget.status-bar

            toggle-button.toggle( v-on:change="onChange", :labels= {
              checked: 'Open Access',
              unchecked: 'Offline'
            }   v-bind:value="accessStatus" v-bind:width="togglesize" )
            span.relaytext Status:
</template>

<script>
  import StatusWidget from './StatusWidget'

  import bootRelay from '~/relay/boot'
  import HealthManager from '~/relay/net/HealthManager'
  import SyncService from '~/relay/services/SyncService'

  export default {
    data () {
      return {
        currentTab: '',
        accessStatus: StatusReporter.isOpen,
        togglesize: 95
      }
    },
    components: {
      StatusWidget
    },
    created () {
      console.log(" I AM HERE ")
      bootRelay().then(() => {
        SyncService.syncAll()
      })
      

    },
    methods: {
      onChange: function (e) {
        console.log(e.value)
        if (e.value) {
          HealthManager.changeAccess(e.value)
        }
        else {
          HealthManager.changeAccess(e.value)
        }
      }
    }
//    created () {
//      this.currentTab = this.$router.currentRoute.name
//      this.$router.afterEach((to, from) => {
//        this.currentTab = to.name
//      })
//        SyncService.syncAll()
//    }
  }
</script>


<style scoped lang='scss'>
    @import '~styles/settings.scss';

    $border_radius: 0px;
    $header_height: 75px;
    $middle_height: 250px;
    $bottom_height: 255px;
    $footer_height: 60px;

    .y-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .y-header {
        border-radius: $border_radius $border_radius 0 0;
        background: $color_main;
        height: $header_height;
        // box-shadow: 0 2px 0 rgba(0,0,0,0.075);

        flex-grow: 0;
        h1 {
            margin: 0px;
            margin-top: 22px;
            padding: 5px 30px;
            float: left;

            color: #999;
            font-weight: bold;
            font-family: $font_title;
        }
    }

    .y-nav {
        font-family: $font-menu;
        overflow: auto;
        margin-top: 35px;
        margin-right: 15px;
        float: right;
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
                font-size: 16px;

                &:hover {
                    color: #111;
                }
            }

            &.active {
                a {
                    color: black;
                    font-size: 19px;
                    font-weight: bold;
                }
            }
        }
    }

    .y-content {
        clear: both;
        background: #f1f4f7;
        box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.1);
        flex-grow: 1;
    }

    .y-footer {
        height: $footer_height;
        flex-grow: 0;

        clear: both;

        border-radius: 0 0 $border_radius $border_radius;
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
        .relaytext {
            float: right;
            margin-top: 22px;
            margin-right: 5px;
        }
        .toggle {
            float: right;
            margin-top: 20px;
            margin-right: 10px;

        }
    }


</style>
