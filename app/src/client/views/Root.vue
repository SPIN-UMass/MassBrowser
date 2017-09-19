<template lang="pug">
</template>

<script>
  import { store } from '@utils/store'
  
  function getRoute() {
    if (store.state.bootComplete) {
      if (store.state.browserIntegrationComplete) {
        return '/browser-integration'
      } else {
        return '/client'
      }
    } else {
      console.log(store.state)
      if (store.state.registrationComplete) {
        return '/boot'
      } else {
        return '/start'
      }
    }  
  }

  export default {
    created () {
      let route = getRoute()
      this.$router.push(route) 
    }
  }
</script>

<style scoped lang='scss'>
</style>