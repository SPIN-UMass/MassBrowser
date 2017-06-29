<template lang="pug">
</template>

<script>
  import KVStore from '~/utils/kvstore'

  export default {
    created () {
      KVStore.get('role')
      .then(role => {
        if (role === 'client') {
          this.$router.push('client-splash')
        } else if (role === 'relay') {
          this.$router.push('relay')
        } else {
          this.$router.push('start')
        }
      })
    }
  }
</script>

<style scoped lang='scss'>
</style>
