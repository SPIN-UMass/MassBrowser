<template lang="pug">
  #container.p-roleselect
    .content
      h3 Which are you?

      .row.roles
        .col-xs-6
          transition(name='tt')
            .role.panel.panel-colorful.panel-info.text-center
              .panel-body
                h2 Relay Volunteer
                p.description 
                  | You live in an uncensoring region and would like to volunteer to provide full internet access to restricted users.
                a.relay.btn.btn-rounded.btn-lg I Volunteer
        .col-xs-6
          .role.panel.panel-colorful.panel-success.text-center
            .panel-body
              h2 Proxy User
              p.description 
                | You live in censoring region and your access to the Internet is restricted.
              a.client.btn.btn-rounded.btn-lg(href='#/client/home') Take me to the Internet
</template>

<script>
  export default {
    data () {
      return {
  
      }
    }  
  }
</script>

<style scoped lang='scss'>
  #container.p-roleselect {
    background-color: white;
    padding: 20px 50px;

    .roles {
      margin-top: 50px;

      .role {
        h1, h2, h3 {
          margin-top: 5px
        }
        height: 250px;

        &.big {
          height: 350px;
        }

        .description {
          margin-top: 25px;
          height: 80px;
        }

        .btn {
          border: none;
          font-weight: bold;
          color: #eee;
          &.relay {
            background-color: rgba(255, 255, 255, 0.2);
          }
          &.client {
            background-color: rgba(255, 255, 255, 0.2);
          }
          &:hover {
            background-color: rgba(255, 255, 255, 0.8);
            color: #888;
          }
        }
      }
    }
  }
</style>
