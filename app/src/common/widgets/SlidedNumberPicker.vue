<template lang='pug'>
   .slided-picker-container 
      number-picker(
        ref="numberPicker"
        v-on:plusOrMinusClicked="numberPickerValueChanged"
        :max="max" 
        :step="step" 
        :formatter="formatter"
        :initialValue="value"
      )
      vue-slider.slider(
        ref="slider" 
        v-on:drag-start="dragStart" 
        v-on:drag-end="dragEnd" 
        v-on:callback="dragged"
        :min="0"
        :max="sliderRange"
        :value="sliderRange/2"
        :clickable="false" 
        :tooltip="false"
        :processStyle="processStyle" 
        :bgStyle="bgStyle"
        :height="4"
        :dotSize="12"
      )
</template>

<script>
  import vueSlider from 'vue-slider-component'
  import NumberPicker from '@common/widgets/NumberPicker'


  export default {
    components: {
      vueSlider,
      NumberPicker
    },
    data () {
      return {
        numberPickerVal: 0,
        min: 0,
        changingVal: 0,
        interval: null,
        processStyle: {
          backgroundColor: "transparent"
        },
        sliderStyle: [
          {
            "backgroundColor": "#000"
          },
          {
            "backgroundColor": "#000"
          }
        ],
        bgStyle: {
         "backgroundImage": "-webkit-linear-gradient(left, rgba(200, 100, 60, 0.5) , rgba(22,117,178, 0.5)" 
        }
      }
    },
    props: {
      value: {
        type: Number,
        default: 0
      },
      formatter: {
        type: Function,
        default: v => v
      },
      slideStepper: {
        type: Function,
        default: v => v
      },
      sliderRange: {
        type: Number,
        default: 100
      },
      max: {
        type: Number,
        default: 100
      },
      step: {
        type: [Number, Function],
        default: 1
      }
    },
    methods: {
      dragged(val) {
        if (this.interval) {
          this.changingVal = val - this.sliderRange / 2
        }
      },
      dragStart(e, val) {
        this.interval = setInterval(() => {
          if (this.changingVal) {
            this.$refs.numberPicker.val += this.slideStepper(this.changingVal)
          }          
        }, 50)
      },
      dragEnd(e, val) {
        clearInterval(this.interval)
        this.interval = null
        this.$refs.slider.setValue(this.sliderRange / 2)
        this.$emit('input', Number(this.$refs.numberPicker.val))  
      },
      numberPickerValueChanged() {
        this.$emit('input', Number(this.$refs.numberPicker.val))  
      }
    }
  }

</script>

<style scoped lang='scss'>
  @import '~@/views/styles/settings.scss';
  
  .slided-picker-container  {
    .slider {
      margin-top: 3px;
    }
  }
</style>
