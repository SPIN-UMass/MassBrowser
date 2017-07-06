<template lang="pug">
  .y-container
    h1 MassProxy
    .loading-container(v-if="status=='loading'")
      GridLoader.spinner(color="#aaa")
      .status-container
        StatusWidget
    .invitation-container(v-if="status=='prompt'")
      h4 Please enter your invitation code
      input(v-mask="invitationCodeMask" v-model='invitationCode' placeholder='')
      div
        button.btn.btn-rounded.btn-lg(v-on:click='submitInvitationCode' :disabled="!invitationCodeValid" v-bind:class="{'btn-danger': !invitationCodeValid, 'btn-success': invitationCodeValid}") Submit
    .error-container(v-if="status=='error'")
      h4.red {{ errorMessage }}
      div
        button.btn.btn-rounded.btn-lg.btn-warning(v-if="canRetry" v-on:click='bootClient') Try Again
</template>

<script>
  import StatusWidget from './StatusWidget'
  import GridLoader from 'vue-spinner/src/GridLoader.vue'

  import bootClient from '~/client/boot'
  import { InvalidInvitationCodeError, ApplicationBootError } from '~/utils/errors'

  const INVITATION_CODE_LENGTH = 10
  const DELIM = '  '

  var invitationCodePromiseResolve = null

  export default {
    data () {
      return {
        status: 'loading',
        invitationCode: null,
        invitationCodeMask: null,
        invitationCodeValid: false,
        errorMessage: '',
        canRetry: false
      }
    },
    components: {
      StatusWidget,
      GridLoader
    },
    created () {
      this.invitationCodeMask = 'N'.repeat(INVITATION_CODE_LENGTH/2) + DELIM + 'N'.repeat(INVITATION_CODE_LENGTH/2)
      this.bootClient()
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
      submitInvitationCode: function () {
        this.status = 'loading'
        invitationCodePromiseResolve(this.invitationCode.replace(/\s/g, ''))
        this.invitationCode = ''
      },
      bootClient() {
        const promptInvitationCode = () => {
          this.status = 'prompt'

          return new Promise((resolve, reject) => {
            invitationCodePromiseResolve = resolve
          })
        }

        bootClient(promptInvitationCode).
        then(() => {
          this.$router.push({path: '/client'})
        })
        .catch(InvalidInvitationCodeError, err => {
          this.errorMessage = "Invalid invitation code"
          this.status = 'error'
          this.canRetry = true
        })
        .catch(ApplicationBootError, err => {
          this.errorMessage = err.message
          this.status = 'error'
          this.canRetry = err.retriable
        })
      }
    }
  }
</script>


<style scoped lang='scss'>
  @import '~styles/settings.scss';

  .y-container {
      text-align: center;
      background-color: white;
      height: 100%;
      padding-top: 50px;
  }

  h1 {
    font-family: $font_title;
    font-size: 48px;
    margin-top: 0px;
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
    margin-top: 60px;
    
    input {
      margin-top: 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      padding: 9px 0px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .btn {
      margin-top: 40px;
      padding: 10px 80px;
    }
  }
  .error-container {
    margin-top: 60px;
    
    .btn {
      margin-top: 40px;
      padding: 10px 80px;
    }
  }
  
</style>
