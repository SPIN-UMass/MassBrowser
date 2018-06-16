<template lang='pug'>
  .p-websites
    .alert.alert-primary.help(v-if="helpStage > 0" v-on:click="helpStage = 0")
      button.close(data-dismiss="alert" v-on:click="helpStage = 0")
        i.pci-cross.pci-circle
      strong Need Help?
      p Choose which websites you want to use MassBrowser for.
      p Enable proxying for a website if that website is censored for you.


    .tab-base
      ul.nav.nav-tabs
        li(v-for="category in categories" v-bind:class="{ active: selectedCategory.id === category.id }")
          a(v-on:click="selectedCategory=category")
            span.tab-label {{category.name}}
      .tab-container
        .tab-content(v-if="selectedCategory.name !== 'Tor'")
          .toolbar.form-inline
            .form-group
              input#search.form-control(type="text", autocomplete="off", placeholder="Search Website...", v-model='searchQuery')
            .website-list
              table.table
                tbody
                  tr(v-for="item in websites")
                    td.name {{item.name}}
                    td.toggle(v-if='!specialWebsites[item.name]') #[website-toggle.toggle(:website="item")]
                    td.special-website-link-container(v-if='specialWebsites[item.name]')
                      .special-website-link(v-on:click='selectedWebsiteInstructions = item.name') Click here for instructions
            .request-website-hint-container(v-if="websites.length <= 2")
              p Can't find the website you're looking for?
              a(v-on:click="websiteRequest.showModal=true") Request support for a website
        tor-view.special-category(v-if="selectedCategory.name === 'Tor'")
        .website-footer(v-if="selectedCategory.name !== 'Tor'")
           a(v-on:click="websiteRequest.showModal=true") Request support for a website
    .modal-container(v-if='websiteRequest.showModal')
      .modal-backdrop.fade(:class="{in: websiteRequest.showModal}")
      .modal.fade(style='display: block' role='dialog' :class="{in: websiteRequest.showModal}")
        .modal-dialog
          .modal-content
            .modal-header
              button.close(v-on:click='websiteRequest.showModal=false') #[span x]
              .modal-title Request Website Support
            .modal-body(class="{'has-error': websiteRequest.hasError}")
              p Enter website address below
              input.form-control(type="text" placeholder="e.g. https://facebook.com" v-model="websiteRequest.value")
            .modal-footer
              button.btn.btn-danger(v-on:click='websiteRequest.showModal=false') Cancel
              button.btn.btn-primary(v-on:click='submitWebsiteRequest') Submit Request
    website-instructions-modal(
      v-if="selectedWebsiteInstructions != null"
      :website='selectedWebsiteInstructions'
      :website-component='specialWebsites[selectedWebsiteInstructions]'
      :onClose='closeWebsiteInstructions'
    )
</template>

<script>
  import WebsiteToggle from './WebsiteToggle'
  import WebsiteInstructionsModal from './WebsiteInstructionsModal'
  import TorView from './Tor'
  import TelegramView from './TelegramView'

  import Website from '@/models/Website'
  import Category from '@/models/Category'
  import { getService } from '@utils/remote'

  const KVStore = getService('kvstore')
  const websiteSupportService = getService('website-support')

  let allWebsites

  const specialWebsites = {
    'Telegram': TelegramView
  }

  export default {
    data () {
      return {
        websites: [],
        categories: [],
        selectedCategory: {name: '', id: null},
        searchQuery: '',
        helpStage: 0,
        specialWebsites,
        selectedWebsiteInstructions: null,
        websiteRequest: {
          showModal: false,
          value: '',
          hasError: false
        }
      }
    },
    components: {
      'website-toggle': WebsiteToggle,
      'tor-view': TorView,
      'website-instructions-modal': WebsiteInstructionsModal
    },
    async created () {
      allWebsites = await Website.find({thirdParty: false})
      this.websites = allWebsites
  
      let categories = await Category.find({parent: null})
      categories = categories.filter(c => c.name !== 'Third Parties')
      this.categories = [{name: 'All categories', id: null}].concat(categories)

      let helpDone = await KVStore.get('websites-page-help-finished')
      if (!helpDone) {
        this.helpStage = 1
        KVStore.set('websites-page-help-finished', true)
      }
    },
    watch: {
      'searchQuery': function (val) {
        this.filterList(val, this.selectedCategory)
      },
      'selectedCategory': function (val) {
        this.filterList(this.searchQuery, val)
      }
    },
    methods: {
      filterList (query, category) {
        query = query.toLowerCase()
        this.websites = allWebsites.filter(w =>
          (!query || w.name.toLowerCase().indexOf(query) !== -1) &&
          (!category || !category.id || w.category === category.id)
        )
      },
      submitWebsiteRequest () {
        let value = this.websiteRequest.value
        if (!value.startsWith('http')) {
          value = 'http://' + value
        }
        try {
          const url = new URL(value)
          websiteSupportService.requestWebsiteSupport(url.host)
          this.websiteRequest.showModal = false
          this.websiteRequest.value = ''
          this.websiteRequest.hasError = false
        } catch (e) {
          this.websiteRequest.hasError = true
        }
      },
      closeWebsiteInstructions () {
        this.selectedWebsiteInstructions = null
      }
    }
  }
</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';

  $toolbar_height: 34px;
  $toolbar_footer_height: 24px;

  .p-websites {
    .alert.help {
      position: fixed;
      margin: -5px 15px;
      z-index: 1000;
      left: 0;
      right: 0;
      cursor: pointer;
    }

    .nav.nav-tabs {
      display: block;
      float: left;
      width: 28%;
      height: $content-height;
      overflow: auto;

      li {
        float: none;
        
        a {
          cursor: pointer;
        }
      }
    }

    .tab-base {
      margin: 0px;
    }

    .tab-icon {
      font-size: 1em;
      margin-right: 10px;
      color: #888;
    }

    .tab-label {
      font-size: 14px;
    }

    .tab-container {
      height: $content_height;
      display: block;
      float: left;
      width: 72%;
    }

    .tab-content {
      height: $content_height - $toolbar_footer_height;
      padding: 0px 10px;
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
      max-height: $content_height - $toolbar_height - $toolbar_footer_height - 5px;
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

    .request-website-hint-container {
      margin-bottom: 150px;
      text-align: center;

      font-size: 15px;
      font-weight: 500;
      color: #bbb;
      a {
        cursor: pointer;
      }
    }

    .special-category {
      height: $content-height;
      background-color: white;
      padding: 20px 0px;
    }

    td.special-website-link-container {
      text-align: right;
      .special-website-link {
        display: inline;
        color: #1b6d85;
        font-weight: bold;
        cursor: pointer;
        &:hover {
          color: #1a8ad2;
        }
      }
    }


    .website-footer {
      height: $toolbar_footer_height;
      font-size: 13px;
      font-weight: 500;
      background-color: #fefefe;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      padding: 2px 10px;
      a {
        float: right;
        cursor: pointer;
        &:hover {
          color: #f48f42;
        }
      }
    }

    .modal-backdrop.in {
      opacity: 0.5;
    }
    .modal-dialog {
      min-width: 80%;
    }
    .modal-body {
      min-height: 70px;
    }
  }
  
</style>
