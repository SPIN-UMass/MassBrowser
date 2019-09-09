<template lang='pug'>
    .stats-container
        ul.link-tab-container
            li(v-bind:class="{ active: currentTab === 'stats-connections' }")
                router-link(to='/client/stats/connections')
                    span.tab-label connections
            li(v-bind:class="{ active: currentTab === 'stats-sessions' }")
                router-link(to='/client/stats/sessions')
                    span.tab-label sessions
        .tab-content
            router-view.tab-pane.fade.active.in


</template>

<script>
  import { store } from '@utils/store'

  export default {
    store,
    data () {
      return {
        currentTab: 'stats-connections'
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

    .stats-container {
        background-color: $color_main;

        .link-tab-container {
            padding: 5px 20px;
            border-bottom: 1px solid rgba(100,100,100,0.3);
            margin: 0;

            li {
                display: inline-block;
                height: 10px;
                margin-left: 14px;

                font-size: 12px;
                font-family: $font-menu;
                color: #bbb;
                &:hover {
                    color: #94132a;
                }
                &.active {
                    a{
                        color: #94132a;
                        font-weight: bold;
                    }
                }
            }
        }

        .tab-content {
            height: $content_height - 20px;
        }

        .settings-divider {
            border-bottom: 1px solid rgba(50, 50, 50, 0.2);
            margin: 5px 0px 10px 0px;
        }
    }
</style>
