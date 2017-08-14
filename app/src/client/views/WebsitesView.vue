<template lang='pug'>
    .websites-container
      .website-list
        ul.list-group
          li.website-item.list-group-item(v-for="item in websites") 
            span {{item.name}}
            website-toggle.toggle(:website="item")
</template>

<script>
  import Website from '@/models/Website'
  import websitesCtrl from '@/controllers/websitesCtrl'

  const WebsiteToggle = {
    render: function(h) {
      return h('toggle-button', { 
        props: {
          width: 80,
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
        label: {checked: 'Enabled', unchecked: 'Disabled'}
      }
    },
    methods: {
      onChange: function(e) {
        this.website.enabled = e.value
        websitesCtrl.toggleWebsite(this.website, e.value)
      }
    }
  }

  export default {
    data () {
      return {
        websites: []
      }
    },
    components: {
      'website-toggle': WebsiteToggle
    },
    async created () {
      this.websites = await websitesCtrl.getWebsites()
    },
    methods: {
      
    }
  }
</script>

<style scoped lang='scss'>
  .website-item {
    .toggle {
      float: right;
    }
  }
</style>
