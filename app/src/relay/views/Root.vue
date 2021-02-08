<template lang="pug">
</template>

<script>
  import { store } from '@utils/store'
  import { getService } from '@utils/remote'
  const registrationService = getService('registration')

  async function getRoute () {
    if (!(await registrationService.isRegistered())) {
      return '/start'
    } else if (store.state.bootComplete) {
      return '/relay'
    } else {
      return '/boot'
    }
  }

  export default {
      async created () {
        console.log("I AM HRERER54")
        
        let route = await getRoute()
        this.$router.push(route)
      }
  }
</script>
