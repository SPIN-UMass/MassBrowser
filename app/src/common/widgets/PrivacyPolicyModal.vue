<template lang='pug'>
  .modal-container(v-if='showModal')
    .modal-backdrop.fade(:class="{in: showModal}")
    .modal.fade(style='display: block' role='dialog' :class="{in: showModal}")
      .modal-dialog
        .modal-content
          .modal-header
            .modal-title Privacy Policy
          .modal-body
            p(v-if='isUpdatedVersion') We have updated our #[span.link(v-on:click='openPrivacyPolicy()') Privacy Policies], please read to continue
            p(v-if='!isUpdatedVersion') Please read our #[span.link(v-on:click='openPrivacyPolicy()') Privacy Policies] to continue
            .mt-15
            input(id='accept' type='checkbox' v-model="accepted")
            label(for='accept').accept-msg I have read and accept the MassBrowser {{role}} Privacy Policies
          .modal-footer
            button.btn.btn-primary(v-on:click='onAccept' :disabled="!accepted") Continue
</template>

<script>
  import open from 'opn'
  import config from '@utils/config'

  export default {
    data () {
      return {
        accepted: false,
        role: config.isRelay ? 'Buddy' : 'Client'
      }
    },
    props: {
      showModal: false,
      isUpdatedVersion: false,
      onAccept: null
    },
    methods: {
      accept() {
        this.accepted = false
        this.onAccept()
      },
      openPrivacyPolicy() {
        if (config.isRelay) {
          open('https://massbrowser.cs.umass.edu/privacy/relay.html')
        } else {
          open('https://massbrowser.cs.umass.edu/privacy/client.html')
        }
      }
    }
  }
</script>

<style lang="scss">
  .modal-backdrop.in {
    opacity: 0.5;
  }
  .modal-dialog {
    min-width: 80%;
  }
  .modal-body {
    min-height: 70px;
  }
  .link {
    color: #2e6da4;
    font-weight: bold;
    cursor: pointer;
    &:hover {
      color: #1a8ad2;
    }
  }
  .mt-15 {
    margin-top: 15px;
  }
  .accept-msg {
    margin-left: 10px;
  }
</style>
