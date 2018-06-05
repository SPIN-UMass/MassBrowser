<template lang='pug'>
  .website-instructions-container.modal-container
    .modal-backdrop.fade.in( v-on:click="onClose()")
    .modal.fade.in(style='display: block' role='dialog')
      .modal-dialog
        .modal-content
          .modal-header
            button.close(v-on:click='onClose()') #[span x]
            .modal-title {{ website }} Instructions
          .modal-body
            component(:is='websiteComponent' :close="onClose")
</template>

<script>
  export default {
    data () {
      return {
      }
    },
    props: {
      website: '',
      websiteComponent: null,
      onClose: null
    },
    methods: {
      show () {
        this.showModal = true
      },
      hide () {
        this.showModal = false
      }
    }
  }
</script>

<style lang="scss">
  .website-instructions-container {
    .modal {
      width: 85%;
      margin: auto;
    }
    .modal-header {
      font-size: 12px;
      padding: 8px 15px;
    }
    .modal-backdrop.in {
      opacity: 0.5;
    }
    .modal-dialog {
    }
    .modal-body {
      min-height: 70px;
    }
  }

</style>
