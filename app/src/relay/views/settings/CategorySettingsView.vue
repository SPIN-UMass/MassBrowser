<template lang='pug'>
  .category-settings-container
    settings-group(title="Website Access")
      div(slot="help")
        p In this page you can restrict the websites you want to allow your connected users to browse.
        p Click on the different types of websites to allow or disallow that website category. If a 
          | category is colored, it means it is allowed. If it is black and white, it is disallowed.
      div(slot="body")
        .category-list
          .category-item(v-for="item in categories" :class="{enabled: item.enabled}" v-on:click="toggleCategory(item)")
            .category-icon 
              img(:src="item.icon")
            .category-name {{ item.name }}
</template>

<script>
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { Category } from '@/models'

  export default {
    components: {
      SettingsGroup
    },
    data () {
      return {
        categories: []
      }
    },
    async created() {
      this.categories = (await Category.find()).filter(c => ['Ads', 'Third Parties'].indexOf(c.name) === -1)
    },
    methods: {
      toggleCategory(category) {
        category.enabled = !category.enabled;
      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .category-settings-container {
    padding: 0px 10px;

    .category-list {
      overflow: auto;
      height: 200px;

      .category-item {
        width: 80px;
        margin: 10px;
        text-align: center;
        vertical-align: top;
        display: inline-block;
        cursor: pointer;

        .category-icon {
          img {
            width: 50px;
            height: 50px;
            filter: grayscale(100%);
            opacity: 0.5;
          }
        }

        .category-name {
          margin-top: 2px;
        }

        &.enabled, &:active {
          .category-icon img{
            filter: grayscale(0%);
            opacity: 1;
          }          
        }

        &:hover:not(.enabled) {
          .category-icon img{
            filter: grayscale(10%);
            opacity: 0.6;
          }          
        }
      }

      
    }
    
  }
</style>
