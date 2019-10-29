/**
 * @fileOverview Contains the class PlanetaryMap.
 *
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */

/*
 * Wrapper around OpenLayers map that parses the WebAtlas JSON, grabs the
 * layers that match the target, creates the OpenLayers view and map, and adds
 * the layers from the JSON to the map.
 */
class PlanetaryMap {

  /**
   * Creates a PlanetaryMap object by first parsing the WebAtlas JSON, then
   * creating the OpenLayers map instance.
   *
   * @constructor
   *
   * @param {string} target - The requested target to display the map for, i.e, Mars.
   * @param {string} projection - The requested projection to dispaly the map in.
   */
  constructor(target, projection) {
    this.mapID = 'map'
    this.target = target;
    this.view = null;
    this.projName = 'north-polar stereographic';
    this.projection = null;
    this.map = null;
    this.zoom = null;
    this.aAxisRadius = null;
    this.bAxisRadius = null;
    this.cAxisRadius = null;

    var layers = this.parseWebAtlas();
    this.createMap(layers);
  }

  /**
   *  Creates the OpenLayers Map instance by creating the map view and
   *  adding base layers and overlays to the map.
   *
   *
   * @param {object} layers - Key-Value pair of base layers and overlays to be
   *                          added to the map.
   */
  createMap(layers) {

    this.createProjection();

    this.view = new ol.View({
      projection: this.projection,
      center: [0, 0],
      zoom: 3
    });

    var mousePositionControl = new ol.control.MousePosition({
      coordinateFormat: ol.coordinate.createStringXY(4),
      // projection: 'EPSG:4326', // Shouldn't need, uses view projction by default
      className: 'custom-mouse-position',
      target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;'
    });

    this.map = new ol.Map({
      controls: ol.control.defaults().extend([mousePositionControl]),
      target: this.mapID,
      view: this.view
    });

    var layerAlreadyVisible = false;
    console.log(layers['base']);
    var baseLayers = layers['base'];
    var count = 0;
    for(var i = 0; i < baseLayers.length; i++) {
      var currentLayer = baseLayers[i];

      // Only set one layer to visible at a time, layer switcher will handle this
      // in the future
      // var layerVisible = currentLayer['primary'];
      // if(layerAlreadyVisible) {
      //   layerVisible = false;
      // }
      // else if(!layerAlreadyVisible && layerVisible == 'true') {
      //   layerAlreadyVisible = true;
      // }

      var computedMaxResolution = (360 / 256);
      // Set to true for now
      var wrapCheck = true;
      if (currentLayer['units'] =='m') {
        wrapCheck = false;
        computedMaxResolution = 20000;
      }
      if(currentLayer['projection'] == 'north-polar stereographic') {
        if(count < 0) {
          count++;
          continue;
        }
        // Add all layers for now until layer switcher is implemented
        var baseLayer = new ol.layer.Tile({
          title: currentLayer['displayname'],
          type: 'base',
          visible: 'true',
          maxResolution: computedMaxResolution,
          source: new ol.source.TileWMS({
            url: currentLayer['url'],
            params:{ 'LAYERS': currentLayer['layer'], 'MAP': currentLayer['map']},
            serverType: 'mapserver',
            crossOrigin: 'anonymous',
            wrapX: wrapCheck
          })
        });
        this.map.addLayer(baseLayer);
        console.log(currentLayer);
        break;
      }
    }

    var overlays = layers['overlays'];
    for(var i = 0; i < overlays.length; i++) {
      var currentLayer = overlays[i];

      var computedMaxResolution = (360 / 256);
      // Set to true for now
      var wrapCheck = true;
      if (currentLayer['units'] =='m') {
        wrapCheck = false;
        computedMaxResolution = 20000;
      }

      var overlay = new ol.layer.Tile({
        title: currentLayer['displayname'],
        visible: currentLayer['primary'],
        maxResolution: computedMaxResolution,
        enableOpacitySliders: true,
        source: new ol.source.TileWMS({
          url: currentLayer['url'] + '?map=' + currentLayer['map'],
          params:{ 'LAYERS': currentLayer['layer']},
          serverType: 'mapserver',
          crossOrigin: 'anonymous',
          wrapX: wrapCheck
        })
      });
      this.map.addOverlay(overlay);
    }

    var wfs = layers['overlays'];
    for(var i = 0; i < wfs.length; i++) {

      var extent = [
            currentLayer['bounds']['left'],
            currentLayer['bounds']['bottom'],
            currentLayer['bounds']['right'],
            currentLayer['bounds']['top']
      ];
      var wfsSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: 'https://astrocloud.wr.usgs.gov/dataset/data/nomenclature/' +
          currentTarget['name'].toUpperCase() + '/WFS?service=WFS&version=1.1.0&request=GetFeature&' +
          'outputFormat=application/json&srsname=EPSG:4326&' +
          'bbox=' + extent.join(',') + ',EPSG:4326',
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
        strategy: ol.loadingstrategy.bbox
      });
      var wfs = new ol.layer.Vector({
        source: wfsSource,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 1.0)',
            width: 2
          })
        })
      });
      this.map.addOverlay(wfs);
    }
  }


  /**
   *  Parses WebAtlas JSON that contains data on each layer separated by target.
   *  Adds JSON layer to correct key-value pair to be used in createMap.
   *
   *
   * @return {object} Key-Value pair of base layers and overlays to be
   *                          added to the map.
   */
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
        this.aAxisRadius = currentTarget['aaxisradius'];
        this.bAxisRadius = currentTarget['baxisradius'];
        this.cAxisRadius = currentTarget['caxisradius'];

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

  createProjection() {
    var targets = projectionDefs['targets'];

    for(var i = 0; i < targets.length; i++) {

      var currentTarget = targets[i];
      if(currentTarget['name'].toLowerCase() == this.target.toLowerCase()) {
        var projections = currentTarget['projections'];

        for(var j = 0; j < projections.length; j++) {
          var currentProj = projections[j];

          if(currentProj['name'].toLowerCase() == this.projName.toLowerCase()) {
            console.log(currentProj);
            proj4.defs(currentProj['code'], currentProj['string']);
            ol.proj.proj4.register(proj4);

            this.projection = new ol.proj.Projection({
              code: currentProj['code'],
              extent: [-2357032, -2357032, 2357032, 2357032]
            });
            return;
          }
        }
      }
    }
  }
}












/*
 * This File contains the Planetary Map Class
 */
/*
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
      //this.map.addOverlay(overlay);
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

  switchTarget(target){
    this.target = String(target);
    //this.map = null;
    console.log(this.map);
  }
}
*/
