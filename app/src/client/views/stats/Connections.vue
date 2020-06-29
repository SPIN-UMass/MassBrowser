<template lang='pug'>
    .stats-connections-container
        .connection-list
            table.table.table-condensed

                tbody
                    tr.connection(v-for="item in connections")
                        td.connection-id {{item.id}}
                        td.connection-host
                            .connection-address {{item.address}}:{{item.port}}
                            .connection-website {{item.website}} - {{item.category}}
                        td.connection-policy {{policyName(item.policy)}}
                        td.connection-stats
                            .connection-relay(v-if="policyName(item.policy) === 'Proxy' && !!item.relay") {{item.relay.ip}}:{{item.relay.port}}
                        td.connection-stats
                          .connection-enabled
                            .switch(:class="{ enabled: item.localConnected, disabled: !item.localConnected}")
                          .connection-traffic {{prettyBytes(item.localSent)}}
                          .connection-traffic {{prettyBytes(item.localReceived)}}

</template>

<script>
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
  import { prettyBytes } from '@utils'

  const connectionStats = getService('connection-stats')


  export default {
    store,
    components: {

    },
    data () {
      return {
        connections: [],
        connectionMap: {}
      }
    },
    async created () {
      this.connections = (await connectionStats.getConnectionInfo()).reverse()
      for (let x of this.connections) {
        this.connectionMap[x.id] = x
      }

      connectionStats.on('new-connection', this.onNewConnection)
      connectionStats.on('updated',  this.onConnectionUpdate)
    },
    beforeDestroy () {
      connectionStats.removeListener('new-connection', this.onNewConnection)
      connectionStats.removeListener('updated', this.onConnectionUpdate)
    },
    methods: {
      onNewConnection (socketInfo) {
        this.connections.unshift(socketInfo)
        this.connectionMap[socketInfo.id] = socketInfo
      },
      onConnectionUpdate (connectionId, updatedInfo) {
        const connectionInfo = this.connectionMap[connectionId]
        for (let key in updatedInfo) {
          if (connectionInfo && connectionInfo[key] !== updatedInfo[key]) {
            connectionInfo[key] = updatedInfo[key]
          }
        }
      },
      policyName (policyCode) {
        return {
          'vanilla_proxy': 'Direct',
          'yaler_proxy': 'Proxy',
          'cachebrowse': 'CacheBrowse'
        }[policyCode] || 'unknown'
      },
      prettyBytes
    }
  }

</script>

<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    .stats-connections-container {
        padding: 0px 0px;

        .connection-list {
            height: $content_height - 30px;
            overflow-y: auto;
            font-size: 11px;

            td {
                vertical-align: middle;
                padding-left: 2px;
                padding-right: 2px;
            }
        }

        .connection-id {
            padding: 0 5px;
            font-weight: bold;
        }

        .connection-address {
        }

        .connection-website {
            font-size: 8px;
        }

        .connection-policy {
            padding-right: 5px !important;
        }

        .connection-stats {
        }
        .connection-enabled {
            margin-right: 2px;
            display: inline-block;
            /*padding: 0 10px;*/
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
            }
        }

        .connection-traffic {
            margin-left: 5px;
            width: 40px;
            display: inline-block;
        }

        .connection-relay {
            display: inline-block;
            margin-left: 5px;
        }
    }
</style>
