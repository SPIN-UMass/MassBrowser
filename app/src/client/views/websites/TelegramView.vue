<template lang='pug'>
  .telegram-container
    .step-1(v-if='step === 1')
      p Open the Telegram application and click on the Menu icon.
      img(:src="imgStep1" width="270")
    .step-2(v-if='step === 2')
      p Click on Settings.
      img(:src="imgStep2" width="270")
    .step-3(v-if='step === 3')
      p Click on Connection Type.
      img(:src="imgStep3" width="270")
    .step-4(v-if='step === 4')
      p Enter the following settings.
      img(:src="imgStep4" width="210")
    .telegram-footer
      button.btn.btn-warn(v-if="step > 1" v-on:click="step -= 1") Back
      button.btn.btn-primary(v-if="step < 4" v-on:click="step += 1") Next
      button.btn.btn-success(v-if="step === 4" v-on:click="close") Done
</template>

<script>
  import imgStep1 from '@assets/images/telegram-step-1.png'
  import imgStep2 from '@assets/images/telegram-step-2.png'
  import imgStep3 from '@assets/images/telegram-step-3.png'
  import imgStep4 from '@assets/images/telegram-step-4.png'

  export default {
    data () {
      return {
        step: 1,
        imgStep1,
        imgStep2,
        imgStep3,
        imgStep4
      }
    },
    props: {
      close: null
    }
  }
</script>

<style scoped lang='scss'>
  .telegram-container {
    text-align: center;
    font-weight: 500;
    font-size: 12px;
    img {
      margin-top: 0;
    }
    
    .telegram-footer {
      text-align: right;
      button {
        padding: 2px 12px;
        font-size: 12px;
      }
    }
  }
</style>
