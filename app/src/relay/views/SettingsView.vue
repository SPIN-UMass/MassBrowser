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
                    label.bandwidth-limit.bandwidth-limit-label KB
                    input.bandwidth-limit()
                li.bandwidth-limit-group.list-group-item(v-bind:class="{'disable': !bandwidthLimited, 'enable': bandwidthLimited}"  )
                    span Upload Limit
                    label.bandwidth-limit.bandwidth-limit-label KB
                    input.bandwidth-limit()
                li.setting-nat.list-group-item
                    div Nat Enabled
                        toggle-button.toggle.to-right(v-on:change='onNatChange' v-bind:value="!natDisable"  v-bind:labels= "{unchecked: 'Nat IP', checked: 'Public IP'}" v-bind:width="80" v-bind:color="{ checked: '#7DCE94',unchecked: '#FF877B'}")
                li.bandwidth-nat-group.list-group-item(v-bind:class="{'disable': natDisable, 'enable': !natDisable}"  )
                    span Port Number
                    input.to-right()


</template>

<script>
  import HealthManager from '~/relay/net/HealthManager'

  export default {
    data () {
      return {
        bandwidthLimited: false,
        natDisable: !HealthManager.natEnabled

      }
    },
    methods: {
      onBandwidthChange: function (e) {
        console.log(e.value)
        this.bandwidthLimited = e.value
      },
      onNatChange: function (e) {
        this.natDisable = !e.value
        HealthManager.changeNatStatus(!this.natDisable)
      }

    }
  }

</script>

<style scoped lang='scss'>
    @import '~styles/settings.scss';

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

    .to-right {
        float: right;
    }

    .disable {
        display: none;
    }

    .enable {
        display: block;
    }

</style>
