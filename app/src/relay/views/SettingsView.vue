<template lang='pug'>
    .settings-container
        .settings-list
            ul.settings-group
                li.settings-bandwidth
                    span bandwidth :
                    bandwidth-toggle.toggle()

</template>

<script>
  const BandwidthToggle = {
    render: function (h) {
      return h('toggle-button', {
        props: {
          width: 80,
          value: false,
          labels: this.label,
          color:{ unchecked: '#7DCE94',checked: '#FF877B'}
        },
        on: {
          change: this.onChange
        }
      })
    },
    data() {
      return {
        label: {checked: 'Limited', unchecked: 'Unlimited'}

      }
    },
    methods: {
      onChange: function (e) {

      }
    }
  }
  export default {
    data () {
      return {
        invitationCode: null

      }
    },
    components: {
      'bandwidth-toggle': BandwidthToggle
    }
  }
</script>

<style scoped lang='scss'>
    @import '~styles/settings.scss';

</style>
