<template lang="pug">

</template>

<script>
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
 
  const registrationService = getService('registration')
  
  async function getRoute() {
    if (store.state.bootComplete) {
      if (!store.state.browserIntegrationComplete) {
        return '/browser-integration'
      } else {
        return '/client'
      }
    } else {
      if (await registrationService.isRegistered()) {
        return '/boot'
      } else {
        return '/start'
      }
    }  
  }

  export default {
    async created () {
      let route = await getRoute()
      this.$router.push(route) 
    }
  }
</script>

<style scoped lang='scss'>
</style>