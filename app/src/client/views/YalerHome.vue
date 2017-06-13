<template>
    <div>
        <main class="main">
            <v-content>
            <v-container fluid>
                <!--<div class="title">Main Content</div>-->
                <div v-show="e1 === 'home'">
                  <!--<map-view class='map-view'></map-view>-->
                  <relay-view class='relay-view'></relay-view>
                </div>
                <div v-show="e1 === 'websites'">
                  <websites-view></websites-view>
                </div>
            </v-container>
            </v-content>
        </main>
        <v-bottom-nav absolute value="true" class="transparent">
            <v-btn flat light class="teal--text" @click.native="e1 = 1" :value="e1 === 1">
              <span>Recents</span>
              <v-icon>history</v-icon>
            </v-btn>
            <v-btn flat light class="teal--text" @click.native="e1 = 'home'" :value="e1 === 'home'">
              <span>Home</span>
              <v-icon>home</v-icon>
            </v-btn>
            <v-btn flat light class="teal--text" @click.native="e1 = 'websites'" :value="e1 === 'websites'">
              <span>Websites</span>
              <v-icon>cloud</v-icon>
            </v-btn>
        </v-bottom-nav>
        <status-widget></status-widget>
       <!--<v-footer>Footer</v-footer>-->
       <!--<button v-on:click="showStatus('asdflkjasdfljsdaf')">CLICKMEEEE</button>-->
    </div>
</template>

<script>
  import State from '~/utils/state'
  import MapView from './MapView'
  import RelayView from './RelayView'
  import WebsitesView from './WebsitesView'
  import StatusWidget from './StatusWidget'

  import RelayService from '~/client/services/RelayService'
  import SyncService from '~/client/services/SyncService'

  import { startClientSocks } from '~/client/net'

  export default {
    data () {
      return {
        e1: 'home'
      }
    },
    components: {
      MapView,
      RelayView,
      WebsitesView,
      StatusWidget
    },
    created () {
      // RelayService.start()
      SyncService.start()

      console.log('Syncing database')
      var syncStatus = State.status('Syncing database...')
      console.log(status)
      SyncService.syncAll()
        .then(() => {
          syncStatus.clear()
          console.log(status)
        })
        .catch(err => {
          console.log(err)
          State.status('Syncing failed', { timeout: true, level: 'error' })
        })

      var proxyStatus = State.status('Starting SOCKS proxy')
      startClientSocks()
        .then(() => proxyStatus.clear())
        .catch(err => {
          console.log(err)
          proxyStatus.clear()
          State.status('Starting SOCKS proxy failed', { timeout: true, level: 'error'})
        })
    },
    methods: {
      showStatus (status, options) {
        State.status(status, options)
      }
    }
  }
</script>

<style scoped>
  .map-view {
    margin-top: 30px;
  }
  .relay-view {
    margin-top: 80px;
  }
</style>
