<template lang="pug">
  GraphWidget(ref='graph' delay=100 maxValue=100 minValue=0)
</template>

<script>
  import GraphWidget from './GraphWidget'
  
  export default {
    data () {
      return {
      }
    },
    props: ['session'],
    components: {
      GraphWidget
    },
    mounted () {
      this.graph = this.$refs.graph
      var timeSeries = this.graph.createTimeSeries({
        fillStyle: 'rgba(20, 80, 180)'
      })
  
      const ACC = 100
      this.session.on('receive', dataSize => {
        var time = Math.trunc(new Date().getTime() / ACC) * ACC
        console.log(time + '   ' + dataSize)
        timeSeries.append(time, dataSize)
      })
    },
    methods: {
    }
  }
</script>


<style scoped lang='scss'>

</style>
