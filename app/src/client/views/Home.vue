<template lang="pug">
  #m-home
    .alert.alert-info.alert-websites(v-if="showWebsitesAlert")
      span(v-on:click="showWebsitesAlert=false")
        icon.close(name="times")
      p Configure the #[strong Websites] you want to use with #[strong MassBrowser] in the 
        | #[strong #[router-link(to='/client/settings/websites') Settings]] page
    MapView#map
    //- GraphView#graph hello
</template>

<script>
  import RelayView from './RelayView'
  import MapView from './widgets/MapView'
  import GraphView from './widgets/GraphView'

  import { store } from '@utils/store'
  
  
  export default {
    store,
    components: {
      RelayView,
      MapView,
      GraphView
    },
    data() {
      return {
        showWebsitesAlert: localStorage.getItem("homeHasBeenRunBefore") !== 'true'
      }
    },
    created() {
      localStorage.setItem("homeHasBeenRunBefore", 'true')
    },
    methods: {

    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  #m-home{
    height: $content_height;
    position: relative;

    .alert-websites {
      position: absolute;
      z-index: 1000;
      border: none;
      width: 80%;
      margin: 0 10%;
      padding-left: 30px;
      padding-right: 10px;
      padding-top: 10px;

      .close {
        position: absolute;
        top: 10px;
        left: 10px;
        &:hover {
          color: orange;
        }
      }

      a {
        color: white;
        &:hover {
          color: orange;
        }
      }
    }

    #map {
      height: 100%;
      // position: absolute;
      // bottom: 2px;
    }

    #graph {
      height: 59%;
      // position: absolute;
      // top: 0px;
    }
  }
  
</style>
