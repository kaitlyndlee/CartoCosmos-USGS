/*
 * This File contains the Planetary Map Class
 */

// PlanetaryMap Class extends OL with custom Planetary related functions
class PlanetaryMap {
  //var target;
  this.view;
  projection;
  map;
  baseLayers;
  overLays;
  zoom;

  constructor(target, layers) {

  }

  function makeView(){
    this.view = new ol.View({
      //extent: extent,
      projection: this.projection,
      center: ol.proj.fromLonLat([37.41, 8.82]),
      zoom: this.zoom
    });
  }

  function parseWebAtlas(){
    var targets = myJSONmaps['targets'];
    bases = [];
    overs = [];

    for(var i = 0, len = targets.length; i < len; i++){
      var currentTarget = targets[i];

      console.log(myJSONmaps.parse());
  }
}

var planetaryMap = new PlanetaryMap({
  target: 'map',
  layers: baseLayers,
  view: new ol.View({
    //extent: extent,
    projection: projection,
    center: ol.proj.fromLonLat([37.41, 8.82]),
    zoom: 4
  })
});
planetaryMap.init();
