<template lang='pug'>
    modal(ref='modal' :options="options" @cancel='onCancel' @response='onResponse')
</template>

<script>
  import modal from '@common/widgets/Modal'
  import { Bus } from '@common/utils'

  export default {
    data () {
      return {
        options: {},
        pendingPromise: null
      }
    },
    components: {
      modal
    },
    created () {
      Bus.$on('modal-confirm-dialog', args => {
        this.confirmDialog(args.title, args.text, args.options)
        .then(response => Bus.$emit(`modal-response-${args.id}`, {error: false, response: response}))
        .catch(err => Bus.$emit(`modal-response-${args.id}`, {error: err}))
      })
    },
    methods: {
      confirmDialog(title, text, options) {
        var options = options || {}
        this.options = {
            title: title,
            body: text,
            yesText: options.yesText,
            noText: options.noText
        }
        this.$refs.modal.show()
        return new Promise((resolve, reject) => {
          this.pendingPromise = {resolve: resolve, reject: reject}
        })
      },
      resolvePromise(response) {
        this.pendingPromise.resolve(response)
        this.pendingPromise = null
      },
      onCancel () {
        this.resolvePromise(false)
      },
      onResponse(response) {
        this.resolvePromise(response)
      }
    }
  }
</script>

<style>
</style>
