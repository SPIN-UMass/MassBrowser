<template lang='pug'>
    .websites-container
      .website-list

</template>

<script>
  import Website from '~/client/models/Website'
  

  export default {
    data () {
      return {
        websites: []
      }
    },
    created () {
      Website.find()
      .then(websites => {
        console.log("WEB")
        console.log(websites)
      })
    },
    methods: {
      
    }
  }
</script>

<style scoped>
  
</style>
