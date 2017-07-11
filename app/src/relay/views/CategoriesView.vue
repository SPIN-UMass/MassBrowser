<template lang='pug'>
    .categories-container
        .categories-list
            ul.list-group
                li.categories-item.list-group-item(v-for="item in categories")
                    span {{item.name}}
                    website-toggle.toggle(:category="item")
</template>

<script>
  import Category from '~/relay/models/Category'
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
        this.category.save()
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
      'categories-toggle': CategoryToggle
    },
    created () {
      console.log('finding categories')
      Category.find()
        .then(categories => {
          console.log('founded categories')
          console.log(categories)
          this.categoies = categories
        })
    },
    methods: {}
  }
</script>

<style scoped lang='scss'>
    .website-item {
        .toggle {
            float: right;
        }
    }
</style>
