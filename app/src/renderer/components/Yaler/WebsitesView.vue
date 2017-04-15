<template>
    <div class='websites-container'>
      <v-card>
        <v-card-title>
          Websites
          <v-spacer></v-spacer>
          <v-text-field
            append-icon="search"
            label="Search"
            single-line
            hide-details
            v-model="query"
          ></v-text-field>
        </v-card-title>
        <v-data-table
            v-bind:headers="headers"
            v-model="websites"
            v-bind:search="query"
          >
          <template slot="items" scope="props">
            <td class="text-xs-left" style='width: 50px'>
              <v-switch primary v-model="props.item.active" light/>
            </td>
            <td class="text-xs-left">{{ props.item.name }}</td>
            <td class="text-xs-left">{{ props.item.category }}</td>
          </template>
        </v-data-table>
      </v-card>
    </div>
</template>

<script>
  import Bus from '../../bus'
  import State from '../../state'

  const tableHeaders = ['Active', 'Name', 'Category']

  export default {
    data() {
      return {
        websites: [{id: 1, name: 'Facebook', category: 'SocialNetwork', popularity:1, domains: [], active: false}],
        headers: tableHeaders.map((val, index) => {return {text: val, value: index, left: true}}),
        query: ''
      }
    },
    created() {
      
    },
    methods: {
      
    }
  }
</script>

<style scoped>
  
</style>
