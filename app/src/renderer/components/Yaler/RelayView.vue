<template>
    <div class='relay-container'>
      <v-data-table v-model='relays' v-bind:headers="headers" hide-actions class='elevation-0'>
        <template slot='items' scope='props'>
          <!--<relay-row :relay="props.item"></relay-row>-->
          <td class='text-xs-left' style='width: 10px'>
            <div class='led' v-bind:class="{green: props.item.connected, yellow: props.item.connecting, red: !props.item.connecting && !props.item.connected}"> 
            </div>
          </td>
          <td class='text-xs-left' style='width: 20px'>{{ props.item._id }}</td>
          <td class='text-xs-left'>{{ props.item.bytesSent }}</td>
          <td class='text-xs-left'>{{ props.item.bytesReceived }}</td>
          <td class='text-xs-left'>{{ props.item.ip }}</td>
          <td class='text-xs-left'>{{ props.item.port }}</td>
        </template>
      </v-data-table>
    </div>
</template>

<script>
  import State from '../../state'
  import RelayService from '~/services/RelayService'
  import { Relay } from '~/services/RelayService'

  const tableHeaders = ['', 'Relay ID', 'Sent', 'Recieved', 'IP Address', 'Port']

  export default {
    data () {
      return {
        relays: [new Relay(0)],
        headers: tableHeaders.map((val, index) => { return {text: val, value: index, left: true} })
      }
    },
    components: {
    },
    created () {
      this.relays = RelayService.getRelays()

      RelayService.on('relays-changed', relays => {
        this.relays = relays
      })
      
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
