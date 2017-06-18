<template lang="pug">
  canvas(ref='canvas' )
</template>

<script>
  import { SmoothieChart, TimeSeries } from 'smoothie'
  
  export default {
    data () {
      return {
      }
    },
    components: {
    },
    props: ['delay', 'maxValue', 'minValue'],
    mounted () {
      var options = {
        labels: {
          disabled: true
        }
        // interpolation: 'step'
      }

      var optionKeys = {
        delay: 'millisPerPixel',
        maxValue: 'maxValue',
        minValue: 'minValue'
      }

      for (let opt in optionKeys) {
        if (this.$props[opt] !== undefined) {
          options[opt] = this.$props[opt]
        }
      }
  
      this.smoothie = new SmoothieChart(options)
      this.smoothie.streamTo(this.$refs.canvas, 500)
    },
    methods: {
      createTimeSeries (options) {
        var timeSeries = new TimeSeries()
        this.smoothie.addTimeSeries(timeSeries, options)
        return timeSeries
      }
    }
  }
</script>


<style scoped lang='scss'>

</style>
