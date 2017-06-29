<template lang="pug">
  .y-container
    h1 MassProxy
    .loading-container(v-if='!promptForInvitationCode')
      GridLoader.spinner(color="#aaa")
      .status-container
        StatusWidget
    .invitation-container(v-if='promptForInvitationCode')
      h4 Please enter your invitation code
      input(v-mask="invitationCodeMask" v-model='invitationCode' placeholder='')
      div
        button.btn.btn-rounded.btn-lg(v-on:click='submitInvitationCode' :disabled="!invitationCodeValid" v-bind:class="{'btn-danger': !invitationCodeValid, 'btn-success': invitationCodeValid}") Submit
</template>

<script>
  import StatusWidget from './StatusWidget'
  import bootClient from '~/client/boot'
  import GridLoader from 'vue-spinner/src/GridLoader.vue'

  const INVITATION_CODE_LENGTH = 10
  const DELIM = '  '

  var invitationCodePromiseResolve = null

  export default {
    data () {
      return {
        promptForInvitationCode: false,
        invitationCode: null,
        invitationCodeMask: null,
        invitationCodeValid: false
      }
    },
    components: {
      StatusWidget,
      GridLoader
    },
    created () {
      this.invitationCodeMask = 'N'.repeat(INVITATION_CODE_LENGTH/2) + DELIM + 'N'.repeat(INVITATION_CODE_LENGTH/2)
      const promptInvitationCode = () => {
        this.promptForInvitationCode = true

        return new Promise((resolve, reject) => {
          invitationCodePromiseResolve = resolve
        })
      }

      bootClient(promptInvitationCode)
    },
    watch: {
      'invitationCode': function(val) {
        let regex = new RegExp(`^[a-zA-Z0-9]{${INVITATION_CODE_LENGTH/2}}\\s*[a-zA-Z0-9]{${INVITATION_CODE_LENGTH/2}}$`)
        this.invitationCodeValid = regex.test(val)
      }
    },
    methods: {
      submitInvitationCode: function () {
        this.promptForInvitationCode = false
        invitationCodePromiseResolve(this.invitationCode.replace(/\s/g, ''))
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
    }

    .btn {
      margin-top: 40px;
      padding: 10px 80px;
    }
  }
  
</style>
