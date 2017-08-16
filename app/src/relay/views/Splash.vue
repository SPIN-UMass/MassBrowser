<template lang="pug">
</template>

<script>
  import splashCtrl from '@/controllers/splashCtrl'

  export default {
    async created () {
      this.$router.push(await splashCtrl.getRoute()) 
    }
  }
</script>

<style scoped lang='scss'>
</style>