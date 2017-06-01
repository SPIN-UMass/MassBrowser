<template lang="pug">
   .table-container
      table.table.table-fixed
        thead
          tr
            th ip address
            th bytes sent
            th bytes received
            th graph
        tbody
          tr(v-for="item in sessions")
            td {{ item.ip }}
            td {{ item.bytesSent }}
            td {{ item.bytesReceived }}
            td 
              //- SessionGraphWidget(
              //-   v-bind:session="item"
              //-   width="100" height="100"
              //- )
</template>

<script>
  import SessionService from '~/client/services/SessionService'
  import { Session } from '~/client/services/SessionService'

  import SessionGraphWidget from '~/client/views/SessionGraphWidget'

  const tableHeaders = ['', 'Relay ID', 'Sent', 'Recieved', 'IP Address', 'Port']

  export default {
    data () {
      return {
        sessions: [new Session()],
        headers: tableHeaders.map((val, index) => { return {text: val, value: index, left: true} })
      }
    },
    components: {
      SessionGraphWidget
    },
    created () {
      this.sessions = SessionService.getSessions()

      SessionService.on('sessions-changed', sessions => {
        this.sessions = sessions
      })
      
    },
    methods: {
    }
  }
</script>

<style scoped lang='scss'>
  @import '~styles/settings';

  $tbody_height: 100%;
  $tcell_width: 25%;

  .table-container {
    background: $color_back;
  
    table {
      width: 100%;
      margin-bottom: 0px;  
    }
    
    thead {
      font-family: $font-menu;
    }

    thead>tr {
      background-color: $color_main; 
      color: #777;
    }

    tbody>tr:nth-child(2n+1) {
      background-color: rgba(0, 0, 0, 0.02);  
    }
    
    td,th {
      text-align: center;
    }

    // Scrollable body
    tbody {
      height: $tbody_height;
      overflow-y: auto;
      box-shadow: 0px -2px 0 0 rgba(0, 0, 0, 0.1);
    }
    
    thead, tbody, tr, td, th {
      display: block;
    }
    
    tr:after {
      content: ' ';
      display: block;
      visibility: hidden;
      clear: both;
    }

    tbody td, thead th {
      width: $tcell_width;
      float: left;
    }
  }
</style>
