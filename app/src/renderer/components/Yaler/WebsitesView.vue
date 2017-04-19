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
              <v-switch primary v-model="props.item.enabled" v-on:change='changed(props.item)' light/>
            </td>
            <td class="text-xs-left">{{ props.item.name }}</td>
            <td class="text-xs-left">{{ props.item.category }}</td>
          </template>
        </v-data-table>
      </v-card>
    </div>
</template>

<script>
  import WebsiteService from '~/services/WebsiteService'
  import Website from '~/models/Website'
  const tableHeaders = ['Active', 'Name', 'Category']

  export default {
    data () {
      return {
        websites: [],
        headers: tableHeaders.map((val, index) => { return {text: val, value: index, left: true} }),
        query: ''
      }
    },
    created () {
      // {name: { $regex: /.*face.*/i}}
      Website.find()
        .then(websites => {
          this.websites = websites
        })
    },
    methods: {
      changed: (website, state) => {
        console.log('Setting website ' + website.name + ' to ' + website.enabled)
        website.save()
      }
    }
  }
</script>

<style scoped>
  
</style>
