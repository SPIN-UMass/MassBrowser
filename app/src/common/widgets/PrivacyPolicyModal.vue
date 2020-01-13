<template>
    <div class="modal-container" v-if="showModal">
        <div class="modal-backdrop fade" :class="{in: showModal}">
        </div>
        <div class="modal fade" style="display: block;" role="dialog" :class="{in: showModal}">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">
                            {{$t('PRIVACY_POLICY')}}
                        </div>
                    </div>
                    <div class="modal-body">
                        <p v-if="isUpdatedVersion">
                            <i18n path="PRIVACY_POLICY_MSG">
                                <span slot="link" class="link" v-on:click="openPrivacyPolicy()">{{$t('PRIVACY_POLICY')}}</span>
                            </i18n>
                        </p>
                        <p v-if="!isUpdatedVersion">
                            <i18n path="PRIVACY_POLICY_PLEASE_READ_MSG">
                                <span slot="link" class="link" v-on:click="openPrivacyPolicy()">{{$t('PRIVACY_POLICY')}}</span>
                            </i18n>
                        </p>
                        <div class="mt-15">

                        </div>
                        <input id="accept" type="checkbox" v-model="accepted" />
                        <label class="accept-msg" for="accept">
                            <i18n path="PRIVACY_POLICY_ACCEPT_MSG">
                                <span slot="role"> {{role}} </span>
                            </i18n>
                        </label>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" v-on:click="onAccept" :disabled="!accepted">
                            {{$t('CONTINUE')}}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
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
      accept () {
        this.accepted = false
        this.onAccept()
      },
      openPrivacyPolicy () {
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
