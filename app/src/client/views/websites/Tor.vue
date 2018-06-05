<template lang='pug'>
  .tor-container
    p To use MassBrowser with Tor, configure the proxy in your TorBrowser to the following settings
    img(:src="torImage" width="350")
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
      margin-top: 20px;
    }
  }
</style>
