<template lang='pug'>
  .feedback-settings-container
    .status-alert.alert(v-if="alert" :class="'alert-' + alert.type")
      .title {{ alert.title }}
      p {{ alert.message }}
    .container
      .row#feedback-header
        .col-xs-12 Feedback
      .row(style="margin-bottom: 10px;")
        .col-xs-12
          span#feedback-msg Help us improve by giving us your feedback.
          #feedback-experience
            .exp-item.negative(v-on:click="selectRate(1)" v-bind:class="{ active: rate === 1 }")
                icon(name="thumbs-down" scale=2)
            .exp-item.positive(v-on:click="selectRate(2)" :class="{ active: rate === 2 }")
                icon(name="thumbs-up" scale=2)
      .row#feedback-input-container
        .col-xs-12
            textarea.form-control#feedback-input(rows="4" v-model="content" :class="{ invalid: !contentValid }")
      .row#log-settings(style='text-align: left')
          input#includeLogs(type="checkbox" v-model="includeLogs")
          label(for="includeLogs") Send logs with feedback

          
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
          includeLogs: true,
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
          const success = await feedbackService.sendFeedback(this.content, this.rate, this.includeLogs)
          if (success) {
            this.showAlert('success', 'Feedback Sent', 'Thank you for providing the feedback')  
            this.content = ''
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
    background: white;
    height: $content_height;
    padding: 10px 40px;

    .status-alert {
      position: absolute;
      z-index: 1000;
      width: 400px;

      .title {
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 14px;
      }
    }

    #feedback-header {
      font-weight: bold;
      font-size: 14px;
      color: rgb(80, 80, 80);
    }

    #feedback-msg {
        font-weight: bold;
        margin-bottom: 15px;
        margin-top: 10px;
    }

    #feedback-input-container {
        #feedback-input.invalid {
          border: 1px solid #f41818;
        }
    }

    #feedback-experience {
        margin-left: 20px;
        font-weight: bold;
        display: inline;
        .exp-item {
            display: inline;

            cursor: pointer;
            margin-left: 15px;
            font-size: 2em;
            color: lightgray;

            &.positive:hover {
                color: #7caeff;
            }

            &.positive.active {
                color:#5771f2;
            }

            &.negative:hover {
                color: #ff7f7f;
            }

            &.negative.active {
                color:#ef4a4a;
            }
        }
    }

    #log-settings {
      margin-top: 10px;
      margin-left: 5px;
      label {
        margin-left: 10px;
      }
    }
    #submit-container {
        margin-top: 10px;
        padding: 0px 80px;
        .btn {
            height: 30px;
        }
    }
  }
</style>
