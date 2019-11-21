/**
 * @fileOverview Contains the class PlanetaryMap.
 * 
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */

/*
 * Wrapper around OpenLayers (OL) map that parses the WebAtlas JSON, grabs the 
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
    this.projName = projection;
    this.projection = null;   // Stores proj code
    this.map = null;
    this.layers = null;
    this.shapeDrawer = new ShapeDrawer(null, null);;

    this.parseWebAtlas();
    this.createMap();
  }
 

  /**
   * Creates the OL Map instance by creating a projection with Proj4js, a 
   * map view, base layer and overlay groups, and map controls.
   *  
   * 
   * @param {object} layers - Key-Value pair of base layers and overlays to be
   *                          added to the map.
   */
  createMap() {

    this.createProjection();

    var view = new ol.View({
      projection: this.projection,
      center: [0, 0],
      zoom: 3,
      minZoom:2,
      maxZoom:10
    });

    var mapLayers = this.createLayers();

    this.map = new ol.Map({
      target: this.mapID,
      view: view,
      layers: mapLayers
    });

    this.shapeDrawer.setMap(this.map);

    this.addControls();
  }


  /**
   * Creates the mouse position, scale line, and layer switcher controls
   * and adds them to the OL map.
   */
  addControls() {
    // Uses the view projection by default to transform coordinates
    var mousePositionControl = new ol.control.MousePosition({
      // Every time the mouse is moved, this function is called and the
      // lat lon are recalculated.
      coordinateFormat: function(coordinate) {
        var lonDirection = document.getElementById("lonDirectionSelect");
        var lonDomain = document.getElementById("lonDomainSelect");
        var latType = document.getElementById("latSelect");

        if(lonDirection.options[lonDirection.selectedIndex].value == 'Positive West') {
          coordinate = GeometryHelper.transformLonDirection(coordinate);
        }
        if(lonDomain.options[lonDomain.selectedIndex].value == '360') {
          coordinate = GeometryHelper.transform180180To0360(coordinate);
        }
        if (latType.options[latType.selectedIndex].value == 'Planetographic') {
          coordinate = GeometryHelper.transformOcentricToOgraphic(coordinate);
        }
        return ol.coordinate.format(coordinate, '{y}, {x}', 4);
      },
      className: 'lonLatMouseControl',
      target: document.getElementById('lonLat'),
      undefinedHTML: '&nbsp;'
    });

    var scaleLine = new ol.control.ScaleLine();
    var layerSwitcher = new ol.control.LayerSwitcher();

    // Shape drawing controls 
    var vectorSource = new ol.source.Vector({
      wrapX: false
    });

    // Add modify interaction here so that we can modify a shape without clicking
    // the "draw shape" button.
    var modify = new ol.interaction.Modify({
      source: vectorSource
    });

    var thisContext = this;
    modify.on("modifyend", function(event) {
      var format = new ol.format.WKT();
      event.features.forEach(function(feature) {
        if(feature) {
          var wkt = format.writeFeature(feature);
          thisContext.shapeDrawer.removeFeatures();
          wkt = thisContext.shapeDrawer.transformGeometry(wkt);
          thisContext.shapeDrawer.saveShape(wkt);
        }
      });
    });
    this.map.addInteraction(modify);
    this.shapeDrawer.setSource(vectorSource);

    // Set the style to rgba(0, 0, 0, 0) so that the shape is
    // transparent. This is because we add a feature in the drawFeature
    // method of ShapeDrawer. We do not want the original shape to be drawn
    // when we warp the projection.
    // There might be a better way to do this
    var drawShape = new ol.layer.Vector({
      source: vectorSource,
      // extent: [0,-90, 360, 90],
      style: new ol.style.Style({
        fill: new ol.style.Fill({
         color: "rgba(0, 0, 0, 0)"
       }),
        stroke: new ol.style.Stroke({
          color: "rgba(0, 0, 0, 0)",
          width: 0
        })
      })
    });
    this.map.addLayer(drawShape);

    this.map.addControl(mousePositionControl);
    this.map.addControl(scaleLine);
    this.map.addControl(layerSwitcher);  
  }


  /**
   * Parses WebAtlas JSON that contains data on each layer separated by target.
   * Adds JSON layer to correct key-value pair to be used in createMap.
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
        GeometryHelper.majorRadius = currentTarget['aaxisradius'];
        GeometryHelper.minorRadius = currentTarget['caxisradius'];

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

          proj4.defs(currentProj['code'], currentProj['string']);
          ol.proj.proj4.register(proj4);
          var projection = ol.proj.get(currentProj['code']);

          var extent = [
            currentProj['extent']['left'],
            currentProj['extent']['bottom'],
            currentProj['extent']['right'],
            currentProj['extent']['top']
          ];

          var worldExtent = [
            currentProj['worldExtent']['left'],
            currentProj['worldExtent']['bottom'],
            currentProj['worldExtent']['right'],
            currentProj['worldExtent']['top']
          ];
          projection.setExtent(extent);
          projection.setWorldExtent(worldExtent);

          if(currentProj['name'].toLowerCase() == this.projName.toLowerCase()) {
            this.projection = currentProj['code'];
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

        // Set to true by default
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

    var thisContext = this;
    for(var i = 0; i < this.layers['wfs'].length; i++) {
      var currentLayer = this.layers['wfs'][i];
      var wfsSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) { 
          return 'https://astrocloud.wr.usgs.gov/dataset/data/nomenclature/' +
          thisContext.target.toUpperCase() + '/WFS?service=WFS&version=1.1.0&request=GetFeature&' +
          'outputFormat=application/json&srsname=' + thisContext.projection + '&' +
          'bbox=' + extent.join(',') + ',' + thisContext.projection;
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
        strategy: ol.loadingstrategy.bbox
      });
      var wfsOverlay = new ol.layer.Vector({
        title: 'WFS',
        source: wfsSource,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 1.0)',
            width: 2
          })
        })
      });
      overlays.push(wfsOverlay);
    }  

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


  /*
   * Switches the projection by creating a new map with the layers corresponding
   * to the new projection.
   * 
   * When the user selects a different option for the projection, this method
   * gets called from MapInstance. 
   * 
   * @param {string} newProjection - New projection to load layers for.
   */
  switchProjection(newProjection) {
    this.destroy();
    this.projName = newProjection.toLowerCase();
    this.createMap();
    this.shapeDrawer.redrawFeature();
  }


  /*
   * Destroys the OL map.
   */
  destroy() {
    this.map.setTarget(null);
    this.map = null;
  }

}
