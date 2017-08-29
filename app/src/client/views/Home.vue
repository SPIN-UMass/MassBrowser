<template lang="pug">
  #m-home
    MapView
</template>

<script>
  import RelayView from './RelayView'
  import MapView from './widgets/MapView'

  export default {
    data () {
      return {
      }
    },
    components: {
      RelayView,
      MapView
    },
    mounted () {

    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/styles/settings.scss';
  #m-home{
    height: $content_height;
    .bottom {
      background: $color_main;

      ul.options {
        font-family: $font-menu;
        
        overflow: auto;
        list-style-type: none;
        margin: 0;
        padding: 2px 28px;
        $c_normal: rgba(195, 195, 199, 1.0);
        $c_hover: black;
        $c_active: black;
        li {
          float: left;
          cursor: pointer;
          a {        
            display: block;
            text-align: center;
            padding: 10px 16px;
            text-decoration: none;

            color: $c_normal;    
            font-size: 16px;

            &:hover {
              color: $c_hover;
            }    
          }
          &.active {
            a{
              color: $c_active;
              font-weight: bold;
            }
          }
        }
      }
        
    }
  }
  
</style>
