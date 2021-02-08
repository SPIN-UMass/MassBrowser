<template lang="pug">
  .y-register
    .dragger
    .y-container
      h1 MassBrowser
      .loading-container(v-if="status=='loading'")
        GridLoader.spinner(color="#aaa")
        .status-container  {{ statusMessage }}
      .invitation-container(v-if="status=='prompt'")
        h4 {{$t('REGISTRATION_MSG')}}
        form(v-on:submit='submitInvitationCode')
          input(v-mask="invitationCodeMask" v-model='invitationCode' placeholder='')
          .error-container(v-if="!!errorMessage")
              h4.red {{ errorMessage }}
          div
            button.btn.btn-rounded.btn-lg(:disabled="!invitationCodeValid" v-bind:class="{'btn-danger': !invitationCodeValid, 'btn-success': invitationCodeValid}") Submit

</template>

<script>
  // import StatusWidget from './StatusWidget'
  import GridLoader from 'vue-spinner/src/GridLoader.vue'
  import { InvalidInvitationCodeError, APIError, NetworkError } from '@utils/errors'
  import { getService } from '@utils/remote'

  import { store } from '@utils/store'

  const RegistrationService = getService('registration')

  const INVITATION_CODE_LENGTH = 10
  const DELIM = '  '

  export default {
    data () {

      return {
        status: 'prompt',
        invitationCode: null,
        invitationCodeMask: null,
        invitationCodeValid: false,
        errorMessage: '',
        canRetry: false,
        statusMessage: ''
      }
    },
    components: {
      GridLoader
    },
    async created () {
      console.log("REGISTER CREATED")
      await store.ready
      this.invitationCodeMask = 'N'.repeat(INVITATION_CODE_LENGTH/2) + DELIM + 'N'.repeat(INVITATION_CODE_LENGTH/2)
      console.log("MMM")
      let registered = await RegistrationService.isRegistered()
      console.log(" MMM  REG", registered)

      if (registered) {
        this.$router.push('/')
      } 
    },
    watch: {
      /**
       * Watch and validate the invitation code entered by the user
       */
      'invitationCode': function(val) {
        let regex = new RegExp(`^[a-zA-Z0-9]{${INVITATION_CODE_LENGTH/2}}\\s*[a-zA-Z0-9]{${INVITATION_CODE_LENGTH/2}}$`)
        this.invitationCodeValid = regex.test(val)
      }
    },
    methods: {

      async submitInvitationCode () {
        await store.ready
        this.status = 'loading'
        let invitationCode = this.invitationCode.replace(/\s/g, '')
        this.invitationCode = ''
        await RegistrationService.registerClient(invitationCode)
        .then((client) => {
          this.$router.push('/')
          })
        .catch(err => {
          if (err instanceof InvalidInvitationCodeError) {
            this.errorMessage = this.$t('ERROR_INVALID_INVITATION_CODE')
            this.status = 'prompt'
          } else if (err instanceof NetworkError) {
            this.errorMessage = this.$t('ERROR_CONNECTING_TO_SERVER')
            this.status = 'prompt'
          } else if (err instanceof APIError) {
            this.status = 'prompt'
            this.errorMessage = this.$t('ERROR_UNKNOWN_REGISTRATION')
          } else {
            throw err
          }
        })
      }
    }
  }
</script>


<style lang='scss'>
  @import '~@/views/styles/settings.scss';

  .y-register {
    background-color: white;
    height: 100%;
    padding-top: 50px;

    .dragger {
      -webkit-app-region: drag;
      position: fixed;
      height: 50px;
      width: 100%;
      top: 0;
    }

    .y-container {
      text-align: center;
    }

    h1 {
      font-family: $font_title;
      font-size: 36px;
      margin-top: 0;
    }

    .loading-container {
      margin-top: 80px;

      .spinner {
        margin: auto;
      }

      .status-container {
        margin-top: 40px;
        font-size: 16px;
      }
    }

    .invitation-container {
      margin-top: 30px;

      input {
        margin-top: 20px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        padding: 2px 0;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .btn {
        margin-top: 40px;
        padding: 10px 80px;
      }
    }
    .error-container {
      margin-top: 20px;
      margin-bottom: -20px;
      color: red;
      .btn {
        margin-top: 40px;
        padding: 10px 80px;
      }
    }
  }


</style>
