<template lang='pug'>
  #map-container
    #mapdiv(ref="mapdiv")
</template>

<script>
  import Datamap from '@assets/datamaps.world.js'
  import { getLocationForIP, getMyIP } from '@utils/geoip'
  import { store } from '@utils/store'

  var map

  export default {
    store,
    data() {
      return {
        pins: [],
        pinMap: {},
        arcs: [],
        selfPin: null
      }
    },
    computed: {
      sessions() {
        return this.$store.state.sessions
      }
    },
    created() {

    },
    async mounted () {
      map = createMap(this.$refs.mapdiv)
      map.bubbles(this.pins)

      await this.addSelfPin()

      let self = this

      this.$store.watch(state => state.sessions, (state) => {
        // console.log("CHANGE")
        return self.updateSessions(self.$store.state.sessions)
      }, { deep:true })

      self.updateSessions(self.$store.state.sessions)
    },
    // watch: {
    //   sessions: {
    //     handler(sessions) {
    //       return this.updateSessions(sessions)
    //     },
    //     deep: true
    //   }
    // },
    methods: {
      addPin(pin) {
        this.pins.push(pin)
        this.pinMap[pin.id] = pin
        map.bubbles(this.pins)
      },
      addArc(arc) {
        this.arcs.push(arc)
        map.arc(this.arcs)
      },
      async addSelfPin() {
        let myIP = await getMyIP()
        let loc = await getLocationForIP(myIP)

        let pin = new Pin('self', loc.longitude, loc.latitude)
        pin.selfPin()
        this.selfPin = pin
        this.addPin(pin)
      },
      async updateSessions(sessions) {
        for(let i = 0; i < sessions.length; i++) {
          let session = sessions[i]
          if (!session.id) {
            continue
          }

          if (this.pinMap[session.id] === undefined) {
            let loc = await getLocationForIP('178.62.241.153')//session.ip)
            let pin = new Pin(session.id, loc.longitude, loc.latitude)

            // setTimeout(() => {
              this.addPin(pin)
            // }, 100)
            // console.log(this.pins)
            // setTimeout(() => {
              console.log("AAAAAAA")
              console.log(this.selfPin)
              console.log(pin)
              this.addArc(new Arc(this.selfPin, pin))
            // }, 500)

          }
        }
      }
    }
  }

  function createMap(element) {
    return new Datamap({
      element: element,
      scope: 'world',
      // responsive: true,
      // projection: 'azimuthalEqualArea'
      projection: 'mercator',
        setProjection: function(element, options) {
        var projection, path;
        projection = d3.geo.mercator()
            .center([3, 40])
            .translate([element.offsetWidth / 2, element.offsetHeight / 2])
            .scale(80)
            // .center([-70, 40])
            // .translate([element.offsetWidth / 2, element.offsetHeight / 2])
            // .scale(1000)

        path = d3.geo.path()
            .projection( projection );
        return {path: path, projection: projection};
      },
      // height: 250,
      width: 500,
      geographyConfig: {
        hideAntarctica: true,
        borderWidth: 0.1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        // popupTemplate: function(geography, data) { //this function should just return a string
        //   return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        // },
        popupOnHover: false, //disable the popup while hovering
        highlightOnHover: false,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1
      },
      fills: {
        defaultFill: '#ABDDA4',
        connected: 'blue',
        disconnected: 'red',
        self: 'green'
      },
      bubblesConfig: {
        animate: false,
        borderWidth: 0,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: false,
        radius: null,
        popupTemplate: function(geography, data) {
          return 'sth';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: false,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
      },
      arcConfig: {
        arcSharpness: 0.3,
        strokeWidth: 2,
        strokeColor: 'blue'
      }
    })
  }

  class Pin {
    constructor(id, long, lat) {
      this.id = id
      this.radius = 6
      this.fillKey = 'connected'
      this.longitude = long
      this.latitude = lat
    }

    selfPin() {
      this.fillKey = 'self'
    }
  }

  class Arc {
    constructor(from, to, options) {
      this.origin = {
        longitude: from.longitude,
        latitude: from.latitude
      }
      this.destination = {
        longitude: to.longitude,
        latitude: to.latitude
      }
      this.options = options
    }
  }
</script>

<style scoped>
  #map-container {
    height: 100%;
    width: 100%;
  }
  #mapdiv {
    width: 100%;
    height: 100%;
    margin: auto;
    position: relative;
    top: 0;
  }
</style>
