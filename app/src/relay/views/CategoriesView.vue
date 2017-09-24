<template lang='pug'>
  .categories-container
    .categories-list
      ul.list-group
        li.category-item.list-group-item(v-for="item in categories")
          span {{item.name}}
          category-toggle.toggle(:category="item")
</template>

<script>
  import { Category } from '@/models'
  import { getService } from '@utils/remote'

  const syncService = getService('sync')

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
      async onChange(e) {
        this.category.enabled = e.value
        await Category.update({id: this.category.id}, {$set: {enabled: this.category.enabled}})
        syncService.syncServerAllowedCategories()
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
      Category.find()
        .then(categories => {
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
