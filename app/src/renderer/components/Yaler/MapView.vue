<template>
    <div class="map-container">
      <div id="mapdiv" style="width: 100%; height: 400px;"></div>
    </div>
</template>

<script>
  function initializeMap() {
    AmCharts.makeChart('mapdiv', {
          /**
           * this tells amCharts it's a map
           */
          'type': 'map',

          /**
           * create data provider object
           * map property is usually the same as the name of the map file.
           * getAreasFromMap indicates that amMap should read all the areas available
           * in the map data and treat them as they are included in your data provider.
           * in case you don't set it to true, all the areas except listed in data
           * provider will be treated as unlisted.
           */
          'dataProvider': {
              'map': 'worldLow',
              'getAreasFromMap': true
          },

          /**
           * create areas settings
           * autoZoom set to true means that the map will zoom-in when clicked on the area
           * selectedColor indicates color of the clicked area.
           */
          'areasSettings': {
              // 'autoZoom': true,
            //   'selectedColor': '#CC0000',
            outlineThickness: 0
          },
          handDraw: true,
          handDrawScatter: 100,
          handDrawThickness: 10,
          "zoomControl": {
              "zoomControlEnabled": false,
              homeButtonEnabled: false
          },
          zoomOnDoubleClick: false
      } );
  }
  
  export default {
    created () {
      initializeMap();
    }
  }
</script>

<style scoped>
  
</style>
