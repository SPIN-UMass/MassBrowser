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
        this.website.save()
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
    created () {
      Website.find({thirdParty: false})
      .then(websites => {
        this.websites = websites
      })
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
