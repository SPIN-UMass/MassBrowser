<template lang='pug'>
  .settings-group
    .settings-help-icon(v-if="hasHelp" v-on:click="displayHelp = true")
      i.fas.fa-question-circle
    .settings-help-mask(v-if="displayHelp" v-on:click="displayHelp = false")
    .settings-help.alert(v-if="displayHelp" :class="'alert-' + color")
      button.close(v-on:click="displayHelp = false")
        i.fas.fa-times
      .settings-icon-container
        i.fas.fa-question-circle
      .settings-help-header
        .settings-help-title(v-if="hasTitle") {{ title }}
      .settings-help-body
        slot(name="help")
    .settings-title {{ title }}
    .settings-body
      slot(name="body")
    
        
</template>

<script>
  export default {
    data () {
      return {
        displayHelp: false,
        hasHelp: false,
        hasTitle: false
      }
    },
    props: {
      color: {
        default: 'primary'
      },
      title: ''
    },
    created() {
      this.hasHelp = !!this.$slots.help
      this.hasTitle = !!this.title
    }
  }

</script>

<style scoped lang='scss'>
  .settings-group {
    .settings-title {
      color: #666;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .settings-help-icon {
      float: right;
      cursor: pointer;
      font-size: 1em;
      &:hover {
        color: #48b; 
      }
      &:active {
        color: #88f; 
      }
    }

    .settings-help-mask {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(50, 50, 50, 0.1);
    }

    .settings-help {
      position: fixed;
      width: 85%;
      z-index: 1000;
      left: 0;
      right: 0;
      top: 50px;
      margin: auto;

      .close {
        cursor: pointer;
      }

      .settings-icon-container {
        float: left;
      }

      .settings-help-header {
        float: left;
        overflow: auto;
        margin-bottom: 5px;
        i {
          font-size: 16px;
          float: left;
          margin-top: 1px;
        }

        .settings-help-title {
          float: left;
          margin-left: 10px;
          font-weight: bold;
          font-size: 14px;
        }
      }

      .settings-help-body {
        clear: both;
        margin-top: 10px;
      }
    }
  }

</style>
