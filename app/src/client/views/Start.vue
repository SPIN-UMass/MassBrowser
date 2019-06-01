<template lang="pug">
    #container.p-index
        .dragger
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

        padding: 50px 80px;

        .dragger {
            -webkit-app-region: drag;
            position: fixed;
            height: 50px;
            width: 100%;
            top: 0;
        }

        h1 {
            font-size: 36px;
            color: #94132a;
            font-family: "Neuropol";
        }

        h3 {
            font-size: 16px;
        }

        .btn.get-started {
            font-weight: bold;
            float: right;
            margin-top: 70px;
        }
    }
</style>
