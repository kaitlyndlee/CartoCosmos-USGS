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
  constructor(target, projection, consoleSettings) {
    this.mapID = 'map'
    this.target = target;
    this.view = null;
    this.projName = projection;
    this.projection = null;
    this.map = null;
    this.zoom = null;
    this.aAxisRadius = 0;
    this.bAxisRadius = 0;
    this.cAxisRadius = 0;
    this.console = null;
    this.consoleSettings = consoleSettings;
    this.layers = null;

    this.parseWebAtlas();
    this.createMap();
  }
 
  /**
   *  Creates the OL Map instance by creating a projection with Proj4js, a 
   *  map view, base layer and overlay groups, and map controls.
   *  
   * 
   * @param {object} layers - Key-Value pair of base layers and overlays to be
   *                          added to the map.
   */
  createMap() {

    this.createProjection();

    this.view = new ol.View({
      projection: this.projection,
      center: [0, 0],
      zoom: 3,
      minZoom:2,
      maxZoom:10
    });

    var mapLayers = this.createLayers();



    this.map = new ol.Map({
      target: this.mapID,
      view: this.view,
      layers: mapLayers
    });

    if (this.console == null) {
      this.console = new Console(this, this.consoleSettings);
    }
  
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


    var latStyle = new ol.style.Text({
      font: '12px Calibri,sans-serif',
      textBaseline: 'bottom',
      textAlign: 'end',
      fill: new ol.style.Fill({
        color: '#eee'
      })
    });

    var cordLabels = function(lon){
      return lon.toFixed(2);
    };
    var nullLabels = function(lon){
      return '';
    };

    if (this.projName == "cylindrical") {
      //var graticule  = new AstroGraticule({
      var graticule  = new ol.Graticule({
        // the style to use for the lines, optional.
            strokeStyle: new ol.style.Stroke({
              width: .5,
              color: "#fff"
            }),
            showLabels: true,
            lonLabelFormatter: cordLabels,
            latLabelFormatter: cordLabels,
            latLabelStyle: latStyle,
            lonLabelStyle: latStyle
        },
        this.projName);
      graticule.setMap(this.map);
    } 
    // else {
    //   var graticule  = new ol.Graticule({

    //           // the style to use for the lines, optional.
    //         strokeStyle: new ol.style.Stroke({
    //           width: .5,
    //           color: "#fff"
    //         }),
    //         showLabels: true,
    //         lonLabelFormatter: nullLabels,
    //         latLabelFormatter: cordLabels,
    //         latLabelStyle: latStyle,
    //         lonLabelStyle: latStyle
    //   },
    //   this.projName);

    // }

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
    this.layers = layers;
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
   *  having to define a transformation.
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

            var extent = [
              currentProj['extent']['left'],
              currentProj['extent']['bottom'],
              currentProj['extent']['right'],
              currentProj['extent']['top']
            ];

            projection.setExtent(extent);
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
   * Note: We are calling non-base layers overlays, but not
   * instantiating them as OL overlays but as OL layers because
   * they need to be treated as layers.
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
  createLayers() {

    var baseLayers = [];
      for(var i = 0; i < this.layers['base'].length; i++) {
        var currentLayer = this.layers['base'][i];

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
      for(var i = 0; i < this.layers['overlays'].length; i++) {
        var currentLayer = this.layers['overlays'][i];

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

  switchProjection(newProjection) {
    // if ((newProjection == 'north-polar stereographic') && (!this.hasNorthPolar)) {
    //   alert('North Polar image is NOT AVAILABLE');
    //   return;
    // }
    // if ((newProjection == 'south-polar stereographic') && (!this.hasSouthPolar)) {
    //   alert('South Polar image is NOT AVAILABLE');
    //   return;
    // }
    this.destroy();
    this.projName = newProjection;
    this.createMap();

    // event callback
    // this.projectionSwitchTrigger();
  }

  destroy() {
    // this.controls.deactivateButtons();
    this.controls = null;  // destroy controls
    this.map.setTarget(null);
    this.map = null;
  }

  mousePosition() {

    var mouseDiv = this.console.mouseLonLatDiv;
    if (document.getElementById(mouseDiv)) {
      document.getElementById(mouseDiv).innerHTML = '';
      var mousePositionControl = new ol.control.MousePosition({
                    coordinateFormat: function(coordinate) {
                      var londom = (document.getElementById('astroConsoleLonDomSelect'));
                      var londir = (document.getElementById('astroConsoleLonDirSelect'));
                      var lattype = (document.getElementById('astroConsoleLatTypeSelect'));
                      if (londir && londir.options[londir.selectedIndex].value == 'PositiveWest') {
                  coordinate = AstroGeometry.transformPosEastPosWest(coordinate);
                      }
                      if (londom && londom.options[londom.selectedIndex].value == '180') {
                  coordinate = AstroGeometry.transform0360To180180(coordinate);
                      }
                      if (londom && londom.options[lattype.selectedIndex].value == 'Plantographic') {
                  coordinate = AstroGeometry.transformOcentricToOgraphic(coordinate);
                      }
                      return ol.coordinate.format(coordinate, '{y}, {x}', 2);
                    },
                    projection: this.astroMap.currentProj,
                    className: 'custom-mouse-position',
                    target: document.getElementById(mouseDiv),
                    undefinedHTML: '&nbsp;'
                  });
      this.map.addControl(mousePositionControl);
    }
  }
}
