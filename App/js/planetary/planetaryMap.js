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
    this.projName = projection;
    this.projection = null;
    this.map = null;
    this.zoom = null;

    var layers = this.parseWebAtlas();
    this.createMap(layers);
  }
 
  /**
   *  Creates the OL Map instance by creating a projection with Proj4js, a 
   *  map view, base layer and overlay groups, and map controls.
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

    var mapLayers = this.createLayers(layers);

    // Uses the view projection by default to transform coordinates
    var mousePositionControl = new ol.control.MousePosition({
      coordinateFormat: function(coordinate) {
        return ol.coordinate.format(coordinate, "Lon: {x}, Lat: {y}", 4);
    },
      // className: 'custom-mouse-position',
      // target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;'
    });

    var scaleLine = new ol.control.ScaleLine();

    var layerSwitcher = new ol.control.LayerSwitcher();

    this.map = new ol.Map({
      target: this.mapID,
      view: this.view,
      layers: mapLayers
    });

    this.map.addControl(mousePositionControl);
    this.map.addControl(scaleLine);
    this.map.addControl(layerSwitcher);  
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


  /**
   *  Parses the projectionDefs JSON defined in planetaryFunctions.js for the
   *  requested target and projection, uses Proj4js to define a proj-string,
   *  and registers the projection in OL so that it can be used
   *  by the map. Because mapserver only accepts requests with
   *  Earth projection codes, we define all proj-strings with
   *  Earth codes, but the rest of the string is specific to the target.
   *  The proj-string allows OL to correctly display the scale line and
   *  mouse position for the requested target and projection without
   *  having to define transformation.
   */ 
  createProjection() {
    var targets = projectionDefs['targets'];

    for(var i = 0; i < targets.length; i++) {

      var currentTarget = targets[i];
      if(currentTarget['name'].toLowerCase() == this.target.toLowerCase()) {
        var projections = currentTarget['projections'];

        for(var j = 0; j < projections.length; j++) {
          var currentProj = projections[j];

          if(currentProj['name'].toLowerCase() == this.projName.toLowerCase()) {
            proj4.defs(currentProj['code'], currentProj['string']);
            ol.proj.proj4.register(proj4);

            var projection = ol.proj.get(currentProj['code']);
            projection.setExtent([-2357032, -2357032, 2357032, 2357032]);
            this.projection = currentProj['code'];
            return;
          }
        }
      }
    }
  }


  /*
   * Creates OL layers from the parsed JSON matching the requested projection.
   *
   * Because we are using the plugin ol-layerswitcher, it
   * requires us to add our layers to LayerGroups and
   * add the LayerGroups to the map.
   *
   * @param {object} layers - Key-Value pair of base layers and overlays to be
   *                          added to the map.
   *
   * @return {array} Array containing the base layer and overlay groups. 
   *                 If there are no overlays, just returns an array with
   *                 the base layer group.
   */
  createLayers(layers) {

    var baseLayers = [];
      for(var i = 0; i < layers['base'].length; i++) {
        var currentLayer = layers['base'][i];

        var computedMaxResolution = (360 / 256);
        // Set to true for now
        var wrapCheck = true;
        if (currentLayer['units'] == 'm') {
          wrapCheck = false;
          computedMaxResolution = 20000;
        }
        if(currentLayer['projection'].toLowerCase() == this.projName.toLowerCase()) {
          var isPrimary = (currentLayer['primary'] == 'true');
          var baseLayer = new ol.layer.Tile({
            title: currentLayer['displayname'],
            type: 'base',
            visible: isPrimary,
            maxResolution: computedMaxResolution,
            source: new ol.source.TileWMS({
              url: currentLayer['url'],
              params: {
                'LAYERS': currentLayer['layer'], 
                'MAP': currentLayer['map']},
              serverType: 'mapserver',
              crossOrigin: 'anonymous',
              wrapX: wrapCheck 
            })
          });
          baseLayers.push(baseLayer);
        }
      }

      var overlays = [];
      for(var i = 0; i < layers['overlays'].length; i++) {
        var currentLayer = layers['overlays'][i];

        var computedMaxResolution = (360 / 256);
        // Set to true for now
        var wrapCheck = true;
        if (currentLayer['units'] == 'm') {
          wrapCheck = false;
          computedMaxResolution = 20000;
        }

        if(currentLayer['projection'].toLowerCase() == this.projName.toLowerCase()) {
          var overlay = new ol.layer.Tile({
            title: currentLayer['displayname'],
            visible: false,
            maxResolution: computedMaxResolution,
            enableOpacitySliders: true,
            source: new ol.source.TileWMS({
              url: currentLayer['url'],
              params: { 
                'LAYERS': currentLayer['layer'],
                'MAP': currentLayer['map']},
              serverType: 'mapserver',
              crossOrigin: 'anonymous',
              wrapX: wrapCheck
            })
          });
          overlays.push(overlay);
        }
      }

          // var wfs = layers['wfs'];
      // for(var i = 0; i < wfs.length; i++) {

      //   var extent = [
      //         currentLayer['bounds']['left'],
      //         currentLayer['bounds']['bottom'],
      //         currentLayer['bounds']['right'],
      //         currentLayer['bounds']['top']
      //   ];
      //   var wfsSource = new ol.source.Vector({
      //     format: new ol.format.GeoJSON(),
      //     url: 'https://astrocloud.wr.usgs.gov/dataset/data/nomenclature/' +
      //       currentTarget['name'].toUpperCase() + '/WFS?service=WFS&version=1.1.0&request=GetFeature&' +
      //       'outputFormat=application/json&srsname=EPSG:4326&' +
      //       'bbox=' + extent.join(',') + ',EPSG:4326',
      //     serverType: 'geoserver',
      //     crossOrigin: 'anonymous',
      //     strategy: ol.loadingstrategy.bbox
      //   });
      //   var wfs = new ol.layer.Vector({
      //     source: wfsSource,
      //     style: new ol.style.Style({
      //       stroke: new ol.style.Stroke({
      //         color: 'rgba(0, 0, 255, 1.0)',
      //         width: 2
      //       })
      //     })
      //   });
      //   this.map.addOverlay(wfs);
      // }     

    var baseLayerGroup = new ol.layer.Group({
      'title': 'Base maps', 
      layers: baseLayers
    });

    if(overlays.length == 0) {
      return [baseLayerGroup];
    }
    else {
      var overlayGroup = new ol.layer.Group({
        'title': 'Overlays', 
        layers: overlays
      });
      return [baseLayerGroup, overlayGroup];
    }
  }
}
