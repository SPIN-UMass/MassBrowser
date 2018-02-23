<template lang='pug'>
  .feedback-settings-container
    .status-alert.alert(v-if="alert" :class="'alert-' + alert.type")
      .title {{ alert.title }}
      p {{ alert.message }}
    settings-group(title="Feedback")
      div(slot="body")
        .row#feedback-msg
          .col-xs-12 Help us improve by giving us your feedback.
        .row#feedback-input-container
          .col-xs-12
              textarea.form-control#feedback-input(rows="4" v-model="content" :class="{ invalid: !contentValid }")
        .row#feedback-experience(style="text-align:center")
          //- .col-xs-6(style="margin-top: 5px") Rate your experience
          //- .col-xs-5
          .exp-item(v-on:click="selectRate(0)" v-bind:class="{ active: rate === 0 }")
              i.fa.fa-frown
          .exp-item(v-on:click="selectRate(1)" :class="{ active: rate === 1 }")
              i.fa.fa-meh
          .exp-item(v-on:click="selectRate(2)" :class="{ active: rate === 2 }")
              i.fa.fa-smile
        .row#submit-container
          .col-xs-12
              button.btn.btn-block.btn-info(v-on:click="submit()") Submit Feedback
                
</template>

<script>
  import SettingsGroup from '@common/widgets/SettingsGroup'
  import { getService } from '@utils/remote'
  import { sleep } from "@utils"
  import { setTimeout } from 'timers'

  const feedbackService = getService('feedback')

  export default {
    components: {
      SettingsGroup
    },
    data () {
      return {
          rate: null,
          content: '',
          contentValid: true,
          alert: null
      }
    },
    methods: {
        selectRate(num) {
            if (this.rate === num) {
                this.rate = null;
            } else {
                this.rate = num
            }            
        },
        async submit() {
          if (!this.content) {
            this.contentValid = false
            return
          }
          this.contentValid = true
          const success = await feedbackService.sendFeedback(this.content, this.rate)
          if (success) {
            this.showAlert('success', 'Feedback Sent', 'Thank you for providing the feedback')  
          } else {
            this.showAlert('danger', 'Unsuccessful', "Unfortunately we were not able to submit the feedback, please try again later")
          }
          
          

        },
        async showAlert(type, title, message) {
          this.alert = {
            type,
            title,
            message
          }
          await sleep(5000)
          this.alert = null
        }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .feedback-settings-container {
    padding: 0px 0px;

    .status-alert {
      position: absolute;
      z-index: 1000;
      width: 330px;

      .title {
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 14px;
      }
    }

    #feedback-msg {
        font-weight: bold;
        margin-bottom: 15px;
        margin-top: -5px;
    }

    #feedback-input-container {
        #feedback-input.invalid {
          border: 1px solid #f41818;
        }
    }

    #feedback-experience {
        margin-top: 5px;
        font-weight: bold;
        .exp-item {
            display: inline;

            cursor: pointer;
            margin-left: 10px;
            font-size: 2em;
            color: lightgray;

            &:hover {
                color: #ffe9b2;
            }

            &.active {
                color:#f4b942;
            }
        }
    }

    #submit-container {
        margin-top: 5px;
        padding: 0px 20px;
        .btn {
            height: 30px;
        }
    }
  }
</style>
