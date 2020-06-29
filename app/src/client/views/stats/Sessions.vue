<template lang='pug'>
    .stats-sessions-container
        .session-list
            table.table
                tbody
                    tr.session-item(v-for="item in sessions")
                        td.session-enabled
                            .switch(:class="getEnabledState(item)")
                        td.session-id {{item.id}}
                        td.session-address {{item.ip}}:{{item.port}}
                        td.session-state {{item.state}}
                        td.session-traffic {{prettyBytes(item.sent)}}
                        td.session-traffic {{prettyBytes(item.received)}}


</template>

<script>
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
  import { prettyBytes } from '@utils'

  const sessionService = getService('session')


  export default {
    store,
    components: {

    },
    data () {
      return {
        sessions: [],
        sessionMap: {}
      }
    },
    async created () {
      this.sessions = (await sessionService.getSessionDetails())
      for (let x of this.sessions) {
        this.sessionMap[x.id] = x
      }

      sessionService.on('session-update', this.onSessionUpdate)
      // connectionStats.on('new-connection', socketInfo => {
      //   this.connections.push(socketInfo)
      //   this.connectionMap[socketInfo.id] = socketInfo
      // })
      //

    },
    beforeDestroy () {
      sessionService.removeListener('session-update', this.onSessionUpdate)
    },
    methods: {
      onSessionUpdate (sessionId, updatedInfo) {
        const sessionInfo = this.sessionMap[sessionId]
        if (!sessionInfo) {
          this.sessions.push(updatedInfo)
          this.sessionMap[updatedInfo.id] = updatedInfo
        } else {
          for (let key in updatedInfo) {
            if (sessionInfo[key] !== updatedInfo[key]) {
              sessionInfo[key] = updatedInfo[key]
            }
          }
        }
      },
      prettyBytes,
      getEnabledState (session) {
        return {
          'connected': 'enabled',
          'closed': 'disabled'
        }[session.state] || 'pending';
      }
    }
  }

</script>

<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    .stats-sessions-container {
        padding: 0px 0px;

        .session-list {
            height: $content_height - 30px;
            overflow-y: auto;
            font-size: 11px;
            padding-left: 5px;

            td {
                vertical-align: middle;
                padding-left: 2px;
                padding-right: 2px;
            }
        }

        .session-item {
        }

        .session-id {
            padding: 0 5px;
        }

        .session-address {
        }

        .session-stats {
        }

        .session-enabled {
            padding-left: 5px !important;
            padding-right: 5px !important;
            .switch {
                border-radius: 50%;
                width: 7px;
                height: 7px;

                &.enabled {
                    background-color: #28a745;
                }

                &.disabled {
                    background-color: #dc3545;
                }

                &.pending {
                    background-color: #ffc107;
                }
            }
        }

        .session-traffic {
            /*margin-left: 5px;*/
        }
    }
</style>
