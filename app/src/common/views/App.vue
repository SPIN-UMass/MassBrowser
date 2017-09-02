<template lang='pug'>
  #app(data-app='true')
    router-view
    modal-manager
    
</template>

<script>
  // import AutoUpdater from '@common/services/AutoUpdater'
  import ModalManager from '@common/widgets/ModalManager'
  import { showConfirmDialog } from '@common/utils'

  import { getService } from '@utils/remote'

  const AutoUpdater = getService('autoupdate')

  export default {
    data() {
      return {
      }
    },
    components: {
      ModalManager
    },
    created () {
      
    },
    mounted () {
      this.checkForUpdate()
    },
    methods: {
      checkForUpdate () {
        AutoUpdater.checkForUpdates()
        .then(updateAvailable => {
          if (!updateAvailable) {
            return false
          }

          return showConfirmDialog(
            'Update Available',
            'An update is available, would you like to update?',
            { yesText: 'Update', noText: 'No'}
          )
        })
        .then(shouldUpdate => shouldUpdate ? this.downloadUpdate() : null)
      },
      downloadUpdate () {
        AutoUpdater.downloadUpdate()
        .then(() => showConfirmDialog(
          'Application Restart Needed',
          'Application will now restart for update to take effect',
          { yesText: 'OK', noText: 'Cancel'}
        ))
        .then(() => AutoUpdater.quitAndInstall())
      }
    }
  }
</script>

<style>
  @import url(https://fonts.googleapis.com/css?family=Lato:300);
  @import url(https://fonts.googleapis.com/css?family=Alegreya+Sans+SC);



  html,
  body { 
    height: 100%; 
  }
  #app {
    height: 100%;
  }
</style>
