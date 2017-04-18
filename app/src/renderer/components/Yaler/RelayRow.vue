<template>
  <div>
    <td class='text-xs-left' style='width: 10px'>
      <div class='led' v-bind:class="{green: relay.connected, yellow: relay.connecting, red: !relay.connecting && !relay.connected}"> 
      </div>
    </td>
    <td class='text-xs-left' style='width: 20px'>{{ relay._id }}</td>
    <td class='text-xs-left'>{{ bytesSent }}</td>
    <td class='text-xs-left'>{{ bytesReceived }}</td>
    <td class='text-xs-left'>{{ relay.ip }}</td>
    <td class='text-xs-left'>{{ relay.port }}</td>
  </div>
</template>

<script>
  import State from '../../state'
  import RelayService from '../../services/RelayService'

  const tableHeaders = ['', 'Relay ID', 'Sent', 'Recieved', 'IP Address', 'Port']

  export default {
    data () {
      return {
        bytesSent: 0,
        bytesReceived: 0
      }
    },
    props: ['relay'],
    created () {
      relay.on('recieved', () => {
        
      })
      // var foo = () => {
      //   this.$forceUpdate()
      //   setTimeout(foo, 500)
      // }
      // setTimeout(foo, 500)
    },
    methods: {
    }
  }
</script>

<style scoped lang='scss'>
  .led {
    margin: 20px auto;
    width: 8px;
    height: 8px;

    &.red {
      background-color: #940;
      border-radius: 50%;
      box-shadow: #000 0 0px 3px 1px, inset #600 0 -1px 9px, #F00 0 2px 12px;
    }

    &.yellow {
      background-color: #A90;
      border-radius: 50%;
      box-shadow: #000 0 -1px 7px 1px, inset #660 0 -1px 9px, #DD0 0 2px 12px;
    }

    &.green {
      background-color: #690;
      border-radius: 50%;
      box-shadow: #000 0 -0px 5px 0px, inset #460 0 0px 6px, #7D0 0 2px 12px;
    }

    &.blue {
      background-color: #4AB;
      border-radius: 50%;
      box-shadow: #000 0 -1px 7px 1px, inset #006 0 -1px 9px, #06F 0 2px 14px;
    }
  }
</style>
