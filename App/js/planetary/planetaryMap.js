/*
 * This File contains the Planetary Map Class
 */

// PlanetaryMap Class extends OL with custom Planetary related functions
class PlanetaryMap {

  constructor(target, projection) {
    this.mapID = 'map'
    this.target = target;
    this.view = null;
    this.projection = 'EPSG:4326';  //default for now
    this.map = null;
    this.baseLayers = null;
    this.overlays = null;
    this.zoom = null;

    var layers = this.parseWebAtlas();
    this.createMap(layers);

  }

  // makeView() {
    
  // }

  createMap(layers) {
    this.view = new ol.View({
      //extent: extent,
      projection: this.projection,
      center: ol.proj.fromLonLat([37.41, 8.82]),
      zoom: this.zoom
    });

    // makeView();
    
    this.map = new ol.Map({
      target: this.mapID,
      // layers: [this.baseLayers, this.overlays],
      view: this.view
    });

    var layerAlreadyVisible = false;

    //TODO: separate into smaller methods?
    var baseLayers = layers['base'];
    for(var i = 0; i < baseLayers.length; i++) {
      var currentLayer = baseLayers[i];
      // TODO: Get a better understanding of this
      var layerVisible = currentLayer['primary'];
      if(layerAlreadyVisible) {
        layerVisible = false;
      }
      else if(!layerAlreadyVisible && layerVisible == 'true') {
        layerAlreadyVisible = true;
      }
      var baseLayer = new ol.layer.Tile({
        title: currentLayer['displayname'],
        type: 'base',
        visible: layerVisible,
        // maxResolution: computedMaxResolution,
        source: new ol.source.TileWMS({
          url: currentLayer['url'] + '?map=' + currentLayer['map'],
          params:{ 'LAYERS': currentLayer['layer']},
          serverType: 'mapserver',
          crossOrigin: 'anonymous',
          // wrapX: wrapCheck
        })
      });
      this.map.addLayer(baseLayer);
    }

    var overlays = layers['overlays'];
    for(var i = 0; i < overlays.length; i++) {
      var currentLayer = overlays[i];

      var overlay = new ol.layer.Tile({
        title: currentLayer['displayname'],
        visible: currentLayer['primary'],
        // maxResolution: computedMaxResolution,
        enableOpacitySliders: true,
        source: new ol.source.TileWMS({
          url: currentLayer['url'] + '?map=' + currentLayer['map'],
          params:{ 'LAYERS': currentLayer['layer']},
          serverType: 'mapserver',
          crossOrigin: 'anonymous',
          // wrapX: wrapCheck
        })
      });
      this.map.addOverlay(overlay);
    }
  }

// TODO Change this?
  parseWebAtlas() {
    var layers = {
      'base': [],
      'overlays': [],
      'wfs': []
    };

    var targets = myJSONmaps['targets'];
    for(var i = 0; i < targets.length; i++) {
      var currentTarget = targets[i];

      if (currentTarget['name'].toLowerCase() == this.target) {

        var jsonLayers = currentTarget['webmap'];
        for(var j = 0; j < jsonLayers.length; j++) {
          var currentLayer = jsonLayers[j];
          
          if(currentLayer['type'] == 'WMS') {
            // Base layer check
            if(currentLayer['transparent'] == 'false') {
              layers['base'].push(currentLayer);
            }
            else {
              layers['overlays'].push(currentLayer);
            }
          }  
          else {      
            layers['wfs'].push(currentLayer);
          }  
        }
      }  
    }
    return layers;
  }







}
