<template lang='pug'>
  .graph-container
    #graphdiv(ref="graphdiv")
</template>

<script>
  export default {
    data() {
      return {

      }
    },
    mounted () {

    },
    beforeDestroy() {

    },
    methods: {

    }
  }

</script>

<style scoped>
  .graph-container {
    height: 100%;
    width: 100%;
    background: white;
  }
  #graphdiv {
    background: white;
    width: 100%;
    height: 100%;
    margin: auto;
    /* position: relative;
    top: 0; */
  }
</style>
