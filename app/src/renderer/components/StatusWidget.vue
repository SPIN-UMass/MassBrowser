<template>
    <v-snackbar v-bind:class="level" :timeout='0' :top="true" v-model="show">
      <strong>{{text}}</strong>
      <v-btn flat class="pink--text" v-show="closable" @click.native="show = false"><v-icon>clear</v-icon></v-btn>
    </v-snackbar>
</template>

<script>
  import Bus from '../bus'

  export default {
    data () {
      return {
        text: '',
        show: false,
        closable: false,
        level: ''
      }
    },
    created () {
      const showStatus = (status) => {
        this.text = status.text
        this.show = true
        this.level = status.options.level ? status.options.level : ''
        this.closable = status.options.closable
      }
      const clearStatus = () => {
        this.text = ''
        this.show = false
        this.level = false
        this.closable = false
      }
      Bus.$on('status-changed', showStatus)
      Bus.$on('status-cleared', clearStatus)

      Bus.$emit('status-request')
    }
  }
</script>

<style scoped>
  .map-view {
    margin-top: 30px;
  }
  .relay-view {
    margin-top: 80px;
  }
</style>
