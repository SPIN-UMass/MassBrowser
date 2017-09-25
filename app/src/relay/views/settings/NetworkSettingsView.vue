<template lang='pug'>
  .network-settings-container
    //- .well.well-sm Select the amount of bandwidth you want to dedicate
    settings-group(title="Bandwidth Limit")
      div(slot="help")
        p Choose how much of your bandwidth you want to enable connected clients to use.
        p The #[strong Upload Limit] is amount of traffic you send towards different websites 
          | and the #[strong Download Limit] is the traffic you receive from websites.
        p If you do not want to put any bandwidth restrictions, slide the limits all the way down to 
          | 0 for the ∞ sign to appear.
      .form(slot="body")
        .row
          .col-xs-5
            .form-group
              label.control-label Upload Limit
              slided-number-picker.bandwidth-picker(
                v-model="uploadLimit"
                :max="1000000000"
                :step="stepFunction"
                :formatter="byteFormatter"
                :slideStepper="slideStepper"
                :sliderRange="20"
              )
          .col-xs-5.col-xs-offset-2
            .form-group
              label.control-label Download Limit
              slided-number-picker.bandwidth-picker(
                v-model="downloadLimit"
                :max="1000000000"
                :step="stepFunction"
                :formatter="byteFormatter"
                :slideStepper="slideStepper"
                :sliderRange="20"
              )
    .settings-divider
</template>

<script>
  import SlidedNumberPicker from '@common/widgets/SlidedNumberPicker'
  import SettingsGroup from '@common/widgets/SettingsGroup'

  import { store } from '@utils/store'
  import { prettyBytes } from '@utils'
  import { getService } from '@utils/remote'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')

  export default {
    store,
    components: {
      SlidedNumberPicker,
      SettingsGroup
    },
    computed: {
     uploadLimit: {
       get() {
         return Number(this.$store.state.uploadLimit)
       },
       set(uploadLimit) {
         console.log(`setting ${uploadLimit}`)
         relayManager.setUploadLimit(uploadLimit)
       }
     },
     downloadLimit: {
       get() {
         return Number(this.$store.state.downloadLimit)
       },
       set(downloadLimit) {
         relayManager.setDownloadLimit(downloadLimit)
       }
     }
    },
    methods: {
      byteFormatter(bytes) {
        if (!bytes) {
          return '∞'
        }
        return prettyBytes(bytes) + '/s'
      },
      slideStepper(val) {
        if (val < 0) {
          return - Math.pow(2, -val) * 1000
        }
        return Math.pow(2, val) * 1000
      },
      stepFunction(val) {
        if (val < 1000000) {
          return 10000
        } else {
          return 100000
        }
      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .network-settings-container {
    padding: 0px 10px;
    .control-label {
      font-weight: bold;
      font-size: 11px;
    }

    .bandwidth-picker {
      margin-top: 5px;
    }

    .settings-divider {
      border-bottom: 1px solid rgba(50, 50, 50, 0.2);
      margin: 5px 0px;
    }
  }
</style>
