<template lang="pug">
  #container.p-index
    .content
      h1 MassBrowser
      h3 Best cencorship circumvention tool ever
      router-link(to='register').btn.btn-default.btn-hover-warning.btn-lg.get-started Get Started
</template>

<script>
  export default {}
</script>

<style scoped lang='scss'>
  @font-face {
    font-family: Neuropol;
    src: url('~@common/styles/settings.scss');
  }
  #container.p-index {
    background-color: white;

    padding: 80px;

    h1 {
      font-size: 54px;
      font-family: "Neuropol";
    }

    .btn.get-started {
      font-weight: bold;
      float: right;
      margin-top: 50px;
      margin-right: 100px;
    }
  }
</style>
