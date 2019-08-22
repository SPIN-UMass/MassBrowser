<template lang='pug'>
  .category-settings-container
    settings-group(:title="title")
      div(slot="help")
        p {{$t('RELAY_HELP_FIRST')}}
        p {{$t('RELAY_HELP_SECOND')}}
      div(slot="body")
        .category-list
          .category-item(v-for="item in categories" :class="{enabled: item.enabled}" v-on:click="toggleCategory(item)")
            .category-icon
              img(:src="item.icon")
            .category-name {{ $t(item.name) }}
</template>

<script>
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { Category } from '@/models'
  import { getService } from '@utils/remote'

  const syncService = getService('sync')

  export default {
    components: {
      SettingsGroup
    },
    data () {
      return {
        categories: []
      }
    },
    props: {
      title: {
        default: 'Website Settings'
      },
      syncUpdates: {
        type: Boolean,
        default: true
      }
    },
    async created () {
      this.categories = (await Category.find()).filter(c => ['Ads', 'Third Parties'].indexOf(c.name) === -1)
      console.log(this.categories)
    },
    methods: {
      toggleCategory (category) {
        category.enabled = !category.enabled
        Category.update({id: category.id}, {$set: {enabled: category.enabled}})
        if (this.syncUpdates) {
          syncService.changeCategoryStatus(category.id, category.enabled)
        }
      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  .category-settings-container {
    padding: 0 0;

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
