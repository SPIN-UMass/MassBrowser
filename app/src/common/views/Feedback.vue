<template>
    <div class="feedback-container">
        <div class="status-alert alert" v-if="alert" :class="'alert-' + alert.type">
            <div class="title">
                {{ alert.title }}
            </div>
            <p>{{ alert.message }}</p>
        </div>
        <div class="feedback-msg">
            <span>Help us improve our system by giving us feedback</span>
        </div>
        <div class="feedback-exp">
            <div class="feedback-exp-msg">
                How was your experience
            </div>
            <div class="feedback-emojis">
                <img src="../../../assets/images/angry.png" v-on:click="selectRate(-1)" :class="{active: rate === -1}"/>
                <img src="../../../assets/images/neutral.png" v-on:click="selectRate(0)" :class="{active: rate === 0}"/>
                <img src="../../../assets/images/smiling.png" v-on:click="selectRate(1)" :class="{active: rate === 1}"/>
            </div>
        </div>
        <div class="feedback-input-container">
            <textarea
                    class="form-control"
                    id="feedback-input"
                    rows="4"
                    v-model="content"
                    :class="{ invalid: !contentValid }"
                    :placeholder="rate === -1 ? 'Can you tell us more what went wrong?': rate === 0 ? 'Pocker face! seriously?' : rate === 1 ? 'We are happy that you like it, anything to improve?': 'Tell us more'"
            >
            </textarea>
        </div>
        <div class="feedback-log">
            <input id="includeLogs" type="checkbox" v-model="includeLogs" />
            <label for="includeLogs">Send logs with feedback</label>
        </div>
        <div class="feedback-submit-button" v-on:click="submit()">
            Submit
        </div>
    </div>

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
      selectRate (num) {
        if (this.rate === num) {
          this.rate = null
        } else {
          this.rate = num
        }
      },
      async submit () {
        if (!this.content) {
          this.contentValid = false
          return
        }
        this.contentValid = true
        const success = await feedbackService.sendFeedback(this.content, this.rate, this.includeLogs)
        if (success) {
          this.showAlert('success', 'Feedback Sent', 'Thank you for providing the feedback')
          this.content = ''
          this.rate = null
        } else {
          this.showAlert('danger', 'Unsuccessful', "Unfortunately we were not able to submit the feedback, please try again later")
        }
      },
      async showAlert (type, title, message) {
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

    .feedback-emojis {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        width: 100px;

        img {
            user-select: none;
            cursor: pointer;
            filter: grayscale(100%);
            width: 30px;
            height: 30px;

            &.active {
                filter: none;
            }

            &:hover {
                filter: none;
            }
        }
    }

    .feedback-container {
        background: white;
        height: $content_height;
        padding: 10px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .feedback-exp {
            height: 70px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
        }

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

        .feedback-msg {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 10px;
        }

        .feedback-input-container {
            width: 80%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;

            #feedback-input {
                resize: none;
            }

            #feedback-input.invalid {
                border: 1px solid #f41818;
            }
        }

        .feedback-submit-button {
            background-color: #94132a;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50%;
            height: 50px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;

            &:hover {
                background-color: #b21733;
            }

            &:active {
                margin-top: 1px;
            }
        }

        .feedback-log {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            input {
                margin-right: 5px;
            }
        }
    }
</style>
