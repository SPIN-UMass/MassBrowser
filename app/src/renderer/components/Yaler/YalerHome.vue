<template>
    <div>
        <main class="main">
            <v-content>
            <v-container fluid>
                <!--<div class="title">Main Content</div>-->
                <div v-show="e1 === 'home'">
                  <map-view class='map-view'></map-view>
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
       <button v-on:click="showStatus('asdflkjasdfljsdaf')">CLICKMEEEE</button>
    </div>
</template>

<script>
  import State from '../../state'
  import MapView from './MapView'
  import RelayView from './RelayView'
  import WebsitesView from './WebsitesView'
  import StatusWidget from '../StatusWidget'

  import RelayService from '../../services/RelayService'
  import WebsiteServer from '../../services/WebsiteService'

  export default {
    data () {
      return {
        e1: 'websites'
      }
    },
    components: {
      MapView,
      RelayView,
      WebsitesView,
      StatusWidget
    },
    created () {
      RelayService.start()
      WebsiteServer.start()
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
