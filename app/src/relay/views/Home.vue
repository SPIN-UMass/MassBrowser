<template lang="pug">
  #m-home
    RelayStatus.relay-status
    MapView.map
    //- GraphView#graph
    
</template>

<script>
  import MapView from './widgets/MapView'
  import RelayStatus from './widgets/RelayStatus'

  export default {
    data () {
      return {
      }
    },
    components: {
      MapView,
      RelayStatus
    },
    mounted () {

    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  #m-home{
    height: $content_height;
    position: relative;
    .map {
      height: 88%;
      box-shadow: 0 -1px 0 0 rgba(0,0,0,.1);
    }

    .relay-status {
      // background: blue;
    }
  }
  
</style>
