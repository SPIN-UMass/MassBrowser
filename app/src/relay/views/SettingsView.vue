<template lang='pug'>
    .settings-container
        .settings-list
            ul.list-group
                li.setting-bandwidth.list-group-item
                    div.bandwidth-container
                        div Bandwidth Limit
                            toggle-button.toggle(v-on:change='onBandwidthChange' v-bind:value="bandwidthLimited"  v-bind:labels= "{checked: 'Limited', unchecked: 'Unlimited'}" v-bind:width="80" v-bind:color="{ unchecked: '#7DCE94',checked: '#FF877B'}")
                li.bandwidth-limit-group.list-group-item(v-bind:class="{'disable': !bandwidthLimited, 'enable': bandwidthLimited}"  )
                    span Download Limit
                    button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onDownloadLimitSave") Save
                    label.bandwidth-limit.bandwidth-limit-label KB
                    input.bandwidth-limit()
                li.bandwidth-limit-group.list-group-item(v-bind:class="{'disable': !bandwidthLimited, 'enable': bandwidthLimited}"  )
                    span Upload Limit
                    button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onUploadLimitSave") Save
                    label.bandwidth-limit.bandwidth-limit-label KB
                    input.bandwidth-limit()
                li.setting-nat.list-group-item
                    div IP Type
                        toggle-button.toggle.to-right(v-on:change='onNatChange' v-bind:value="natDisable"  v-bind:labels= "{unchecked: 'Nat IP', checked: 'Public IP'}" v-bind:width="80" v-bind:color="{ checked: '#7DCE94',unchecked: '#FF877B'}")
                li.bandwidth-nat-group.list-group-item(v-bind:class="{'disable': !natDisable, 'enable': natDisable}"  )
                    span Port Number
                    button.btn.btn-rounded.btn-vsm.btn-success.to-right(v-on:click="onPortnumberSave") Save
                    input.to-right(v-bind:value="portNumber")


</template>

<script>
  import HealthManager from '@/net/HealthManager'

  export default {
    data () {
      return {
        bandwidthLimited: HealthManager.bandwidthLimited,
        uploadLimit: HealthManager.uploadLimit / 8000,
        downloadLimit: HealthManager.downloadLimit / 8000,
        natDisable: !HealthManager.natEnabled,
        portNumber: HealthManager.OBFSPortNumber

      }
    },
    methods: {
      onBandwidthChange: function (e) {
        console.log(e.value)
        this.bandwidthLimited = e.value
      },
      onNatChange: function (e) {
        this.natDisable = e.value
        HealthManager.changeNatStatus(!this.natDisable)
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
    @import '~@common/styles/settings.scss';

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
