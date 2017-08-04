<template lang='pug'>
  .modal-container(v-if='showModal')
    .modal-backdrop.fade(:class="{in: showModal}")
    .modal.fade(style='display: block' role='dialog' :class="{in: showModal}")
      .modal-dialog
        .modal-content
          .modal-header
            button.close(v-on:click='cancel()') #[span x]
            .modal-title {{ options.title }}
          .modal-body {{ options.body }}
          .modal-footer
            button.btn.btn-default(v-on:click='no') {{ options.noText }}
            button.btn.btn-primary(v-on:click='yes') {{ options.yesText }}
</template>

<script>
  export default {
    data() {
      return {
        showModal: false
      }
    },
    props: {
      options: {
        title: '',
        body: '',
        yesText: '',
        noText: '',
        cancelable: false
      }
    },
    methods: {
      show() {
        this.showModal = true
      },
      hide() {
        this.showModal = false
      },
      cancel() {
        this.$emit('cancel')
        this.hide()
      },
      yes() {
        this.$emit('response', true)
        this.hide()
      },
      no() {
        this.$emit('response', false)
        this.hide()
      }
    }
  }
</script>

<style>
  .modal-backdrop.in {
    opacity: 0.5;
  }
  .modal-dialog {
    min-width: 80%;
  }
  .modal-body {
    min-height: 70px;
  }
</style>
