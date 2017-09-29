<template lang='pug'>
  .p-websites
    .alert.alert-primary.help(v-if="helpStage > 0" v-on:click="helpStage = 0")
      button.close(data-dismiss="alert" v-on:click="helpStage = 0")
        i.pci-cross.pci-circle
      strong Need Help?
      p Choose which websites you want to use MassBrowser for. 
      p Enable proxying for a website if that website is censored for you.

    .toolbar
      .form-group
        input#search.form-control(type="text", autocomplete="off", placeholder="Search Website...", v-model='searchQuery')
      .website-list
        table.table
          tbody
            tr(v-for="item in websites")
              td.name {{item.name}}
              td.toggle #[website-toggle.toggle(:website="item")]
</template>

<script>
  import Website from '@/models/Website'
  import { getService } from '@utils/remote'

  const KVStore = getService('kvstore')

  let allWebsites

  const WebsiteToggle = {
    render: function(h) {
      return h('toggle-button', { 
        props: {
          width: 100,
          value: this.website.enabled,
          labels: this.label
        },
        on: {
          change: this.onChange 
        }
      })
    },
    props: ['website'],
    data() {
      return {
        label: {checked: 'Proxy', unchecked: "Don't Proxy"}
      }
    },
    methods: {
      onChange: function(e) {
        this.website.enabled = e.value
        Website.update({id: this.website.id}, {$set: {enabled: this.website.enabled}})
      }
    }
  }

  export default {
    data () {
      return {
        websites: [],
        searchQuery: '',
        helpStage: 0
      }
    },
    components: {
      'website-toggle': WebsiteToggle
    },
    async created () {
      this.websites = await Website.find({thirdParty: false}) 
      
      let helpDone = await KVStore.get('websites-page-help-finished')
      if (!helpDone) {
        this.helpStage = 1
         KVStore.set('websites-page-help-finished', true)
      }
    },
    watch: {
      'searchQuery': function(val) {
        this.filterList(val)
      }
    },
    methods: {
      filterList(query) {
        if (query === '') {
          this.websites = allWebsites
          return
        }
        
        query = query.toLowerCase()
        this.websites = allWebsites.filter(w => w.name.toLowerCase().indexOf(query) !== -1)
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  $toolbar_height: 34px;

  .p-websites {
    .alert.help {
      position: fixed;
      margin: -5px 15px;
      z-index: 1000;
      left: 0;
      right: 0;
      cursor: pointer;
    }

    .toolbar {
      height: $toolbar_height;
      margin: 0px;

    
      .form-group {
        margin: 0px;
      }

      #search {
        height: $toolbar_height;
        width: 100%;
        margin: 0px;
        
        outline: none;
        border: none !important;
        -webkit-box-shadow: none !important;
        -moz-box-shadow: none !important;
        box-shadow: none !important;
      
      }
    }
    
    .website-list {
      height: $content_height - $toolbar_height;
      overflow: auto;

      td.name {
        font-weight: bold;
      }

      td.toggle {
        .toggle {
          float: right;
        }
      }
    }
  }
  
</style>
