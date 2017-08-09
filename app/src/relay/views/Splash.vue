<template lang="pug">
</template>

<script>
  import { getService } from '@utils/remote'

  const Context = getService('context')

  export default {
    created () {
      Context.hasBooted.then(booted => this.$router.push(booted ? '/relay' : '/boot'))
    }
  }
</script>

<style scoped lang='scss'>
</style>