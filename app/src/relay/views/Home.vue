<template lang="pug">
  #m-home
    RelayToggleBox.relay-toggle-box
    RelayStatus.relay-status
    //- MapView.map
    //- GraphView#graph
    
</template>

<script>
  import MapView from './widgets/MapView'
  import RelayStatus from './widgets/RelayStatus'
  import RelayToggleBox from './widgets/RelayToggleBox'

  export default {
    components: {
      MapView,
      RelayStatus,
      RelayToggleBox
    },
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  #m-home{
    height: $content_height;
    position: relative;
    border-bottom: 1px solid #dadada;

    .map {
      height: 25%;
      box-shadow: 0 -1px 0 0 rgba(0,0,0,.1);
    }

    .relay-toggle-box {
      height: 50%;
    }
    
    .relay-status {
       height: 50%;
    }
  }
  
</style>
