<template lang="pug">
  #m-home
    MapView#map
    //- GraphView#graph hello
</template>

<script>
  import RelayView from './RelayView'
  import MapView from './widgets/MapView'
  import GraphView from './widgets/GraphView'

  import { store } from '@utils/store'
  
  export default {
    components: {
      RelayView,
      MapView,
      GraphView
    },
    store
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  #m-home{
    height: $content_height;
    position: relative;
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
