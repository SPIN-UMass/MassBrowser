<template lang='pug'>
    .categories-container
        .categories-list
            ul.list-group
                li.category-item.list-group-item(v-for="item in categories")
                    span {{item.name}}
                    category-toggle.toggle(:category="item")
</template>

<script>
  import Category from '~/relay/models/Category'
  import SyncService from '~/relay/services/SyncService'

  const CategoryToggle = {
    render: function (h) {
      return h('toggle-button', {
        props: {
          width: 80,
          value: this.category.enabled,
          labels: this.label
        },
        on: {
          change: this.onChange
        }
      })
    },
    props: ['category'],
    data() {
      return {
        label: {checked: 'Enabled', unchecked: 'Disabled'}
      }
    },
    methods: {
      onChange: function (e) {
        this.category.enabled = e.value
        this.category.save().then(() => {
          SyncService.syncServerAllowedCategories()
        })
      }
    }
  }

  export default {
    data () {
      return {
        categories: []
      }
    },
    components: {
      'category-toggle': CategoryToggle
    },
    created () {
      console.log('finding categories')
      Category.find()
        .then(categories => {
          console.log('founded categories')
          console.log(categories)
          this.categories = categories
        })
    },
    methods: {}
  }
</script>

<style scoped lang='scss'>

    .category-item {
        .toggle {
            float: right;
        }
    }
</style>
