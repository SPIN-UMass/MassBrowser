<template lang='pug'>
  .settings-container
    .tab-base.tab-stacked-left
        ul.nav.nav-tabs
          li.active
            a(data-toggle="tab", href="#demo-stk-lft-tab-1", aria-expanded="true") Home
          li
            a(data-toggle="tab", href="#demo-stk-lft-tab-2", aria-expanded="false") Profile
          li
            a(data-toggle="tab", href="#demo-stk-lft-tab-3", aria-expanded="false") Setting
        .tab-content
          #demo-stk-lft-tab-1.tab-pane.fade.active.in
            p.text-main.text-semibold First Tab Content
            p Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
          #demo-stk-lft-tab-2.tab-pane.fade
            p.text-main.text-semibold Second Tab Content
            p Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
          #demo-stk-lft-tab-3.tab-pane.fade
            p.text-main.text-semibold Third Tab Content
            p
              | Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum clari, fiant sollemnes in futurum.

    //- .settings-list
    //-   ul.list-group
    //-     //- li.setting-bandwidth.list-group-item
    //-     //-   div.bandwidth-container
    //-     //-     div Bandwidth Limit
    //-     //-       toggle-button.toggle(v-on:change='onBandwidthChange' v-bind:value="bandwidthLimited"  v-bind:labels= "{checked: 'Limited', unchecked: 'Unlimited'}" v-bind:width="80" v-bind:color="{ unchecked: '#7DCE94',checked: '#FF877B'}")
    //-     li.bandwidth-limit-group.list-group-item
    //-       span Download Limit
    //-       button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onDownloadLimitSave") Save
    //-       label.bandwidth-limit.bandwidth-limit-label KB
    //-       input.bandwidth-limit()
    //-     li.bandwidth-limit-group.list-group-item
    //-       span Upload Limit
    //-       button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onUploadLimitSave") Save
    //-       label.bandwidth-limit.bandwidth-limit-label KB
    //-       input.bandwidth-limit()
    //-     //- li.setting-nat.list-group-item
    //-     //-   div IP Type
    //-     //-     toggle-button.toggle.to-right(v-on:change='onNatChange' v-bind:value="natDisable"  v-bind:labels= "{unchecked: 'Nat IP', checked: 'Public IP'}" v-bind:width="80" v-bind:color="{ checked: '#7DCE94',unchecked: '#FF877B'}")
    //-     //- li.bandwidth-nat-group.list-group-item(v-bind:class="{'disable': !natDisable, 'enable': natDisable}"  )
    //-     //-   span Port Number
    //-     //-   button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onPortnumberSave") Save
    //-     //-   input.to-right(v-bind:value="portNumber")
</template>

<script>
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')

  export default {
    store,
    data () {
      return {
      }
    },
    computed: {
     uploadLimit: {
       get() {
         return this.$store.state.uploadLimit
       },
       set(uploadLimit) {
         relayManager.setUploadLimit(uploadLimit)
       }
     },
     downloadLimit: {
       get() {
         return this.$store.state.downloadLimit
       },
       set(downloadLimit) {
         relayManager.setDownloadLimit(downloadLimit)
       }
     }
    },
    methods: {
      onBandwidthChange: function (e) {
        console.log(e.value)
        this.bandwidthLimited = e.value
      },
      onNatChange: function (e) {
        this.natDisable = e.value
        relayManager.changeNatStatus(!this.natDisable)
      },
      onUploadLimitSave: function (e) {

      },
      onDownloadLimitSave: function (e) {

      },
      onPortnumberSave: function (e) {

      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .setting-bandwidth {
    .toggle {
      float: right;
    }
  }

  .bandwidth-limit-group {
    .bandwidth-limit {
      float: right;

    }
    .bandwidth-limit-label {
      float: right;
      margin-top: 3px;
      margin-left: 5px
    }
  }

  .btn-vsm {
    height: 20px;
    padding-top: 2px;
    padding-bottom: 2px;
    font-size: 8pt;
  }

  .to-right {
    float: right;
    margin-left: 5px;
  }

  .disable {
    display: none;
  }

  .enable {
    display: block;
  }
</style>
