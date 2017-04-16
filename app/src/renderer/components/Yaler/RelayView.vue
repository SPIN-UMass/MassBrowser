<template>
    <div class='relay-container'>
      <v-data-table v-model='relays' v-bind:headers="headers" hide-actions class='elevation-0'>
        <template slot='items' scope='props'>
          <td class='text-xs-left'>{{ props.item.id }}</td>
          <td class='text-xs-left'>{{ props.item.ip }}</td>
          <td class='text-xs-left'>{{ props.item.port }}</td>
        </template>
      </v-data-table>
    </div>
</template>

<script>
  import RelayService from '../../services/RelayService'
  import Bus from '../../bus'
  import State from '../../state'

  const tableHeaders = ['Relay ID', 'IP Address', 'Port']

  export default {
    data() {
      return {
        relays: State.getRelays(),
        headers: tableHeaders.map((val, index) => {return {text: val, value: index, left: true}})
      }
    },
    created() {
      State.listen('relays', (relays) => {
        this.relays = relays
      })
    },
    methods: {
    }
  }
</script>

<style scoped>
  
</style>
