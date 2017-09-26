<template lang="pug">
</template>

<script>
  import { store } from '@utils/store'
  
  function getRoute() {
    if (!store.state.registrationComplete) {
      return '/start'
    } else if (store.state.bootComplete) {
      return '/relay'
    } else {
      return '/boot'
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