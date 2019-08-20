<template lang='pug'>
  .tor-container
    p {{$t("WEBSITES_TOR_GUIDE")}}
    img(:src="torImage")
</template>

<script>
  import torImage from '@assets/images/tor_settings.png'
  export default {
    data() {
      return {
        torImage
      }
    }
  }
</script>

<style scoped lang='scss'>
  .tor-container {
    text-align: center;
    font-weight: 500;
    img {
        width: 100%;
      margin-top: 20px;
    }
  }
</style>
