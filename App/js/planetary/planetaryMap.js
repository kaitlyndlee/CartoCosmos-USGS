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
    this.footprintLayers = [];
    this.shapeDrawer = new ShapeDrawer(null, null);;
    this.geometryHelper = new GeometryHelper();
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
      zoom: 2,
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

    var currentProj = this.projection;
    var thisContext = this;
    // Uses the view projection by default to transform coordinates
    var mousePositionControl = new ol.control.MousePosition({
      // Every time the mouse is moved, this function is called and the
      // lat lon are recalculated.
      coordinateFormat: function(coordinate) {
        coordinate = ol.proj.transform(coordinate, currentProj, "EPSG:4326");

        var lonDirection = document.getElementById("lonDirectionSelect");
        var lonDomain = document.getElementById("lonDomainSelect");
        var latType = document.getElementById("latSelect");

        if(lonDirection.options[lonDirection.selectedIndex].value == 'Positive West') {
          coordinate = thisContext.geometryHelper.transformLonDirection(coordinate);
        }
        if(lonDomain.options[lonDomain.selectedIndex].value == '360') {
          coordinate = thisContext.geometryHelper.transform180180To0360(coordinate);
        }
        if (latType.options[latType.selectedIndex].value == 'Planetographic') {
          coordinate = thisContext.geometryHelper.transformOcentricToOgraphic(coordinate);
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

    // Add listener to change style of footprints when clicked
    var select = new ol.interaction.Select({
      layers: this.footprintLayers,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
         color: "rgba(255, 255, 0, .25)"
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 0, 1.0)',
          width: 2
        })
      })
    });
    this.map.addInteraction(select);
    var selectedFeatures = select.getFeatures();
    selectedFeatures.on('add', function(event) {
      console.log(event.element.values_.solarlongitude);
    });

    this.map.addControl(mousePositionControl);
    this.map.addControl(scaleLine);
    this.map.addControl(layerSwitcher);
  }


  /**
   * Parses WebAtlas JSON that contains data on each layer separated by target.
   * Adds JSON layer to correct key-value pair to be used in createMap.
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
        this.geometryHelper.majorRadius = currentTarget['aaxisradius'];
        this.geometryHelper.minorRadius = currentTarget['caxisradius'];

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
              wrapX: false
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
            wrapX: false
          })
        });
        overlays.push(overlay);
      }
    }
    
    if(this.projection == "EPSG:4326") {
      var thisContext = this;
      var sliderMin = document.getElementById("solarLongMin").value;
      var sliderMax = document.getElementById("solarLongMax").value;

      // Loading the CTX footprints as a WMS layer
      // var overlay = new ol.layer.Tile({
      //     title: "ctx",
      //     visible: false,
      //     enableOpacitySliders: true,
      //     source: new ol.source.TileWMS({
      //       url: "https://astro-geoserver.wr.usgs.gov/geoserver/upc/wms?service=WMS&version=1.1.0&request=GetMap&layers=upc:mars_ctx&bbox=-180.0,-90.0,180.0,90.0&width=768&height=384&srs=EPSG:4326&format=image/png",
      //       serverType: 'mapserver',
      //       crossOrigin: 'anonymous',
      //       wrapX: false
      //     })
      //   });
      //   overlays.push(overlay);


      // Creating a heatmap from the footprints
      // var vector = new ol.layer.Heatmap({
      //   source: new ol.source.Vector({
      //     url: function(extent) { 
      //       return "https://astro-geoserver.wr.usgs.gov/geoserver/upc/ows?service=WFS&version=1.0.0&srs=EPSG%3A4326"
      //              + "&request=GetFeature&typeName=upc%3Amars_ctx&outputFormat=application%2Fjson&maxFeatures=3000"
      //              // + `&CQL_FILTER=solarlongitude+BETWEEN+${sliderMin}+AND+${sliderMax} AND BBOX(isisfootprint, + ${extent.join(',')})`;
      //            },
      //     format: new ol.format.GeoJSON({
      //       dataProjection: 'EPSG:4326'
      //     })
      //   })
      // });
      // var defaultStyleFunction = vector.getStyleFunction();
      //   vector.setStyle(function(feature, resolution) {
      //     var style = defaultStyleFunction(feature, resolution);
      //     var geom = feature.getGeometry();
      //     if (geom.getType() == 'MultiPolygon') {
      //       var extent = geom.getExtent();
      //       var X = extent[0] + (extent[2]-extent[0])/2;
      //       var Y = extent[1] + (extent[3]-extent[1])/2;
      //       var center =  [X, Y];
      //       style[0].setGeometry(new ol.geom.Point(center));
      //     }
      //     return style;
      //   });

      //   vector.getSource().on('addfeature', function(event) {
      //     var name = event.feature.get("IDENTIFIER");
      //     event.feature.set('weight', (name - 2500000000000)/200000000000);
      //   });
      //   overlays.push(vector);

      // Loading the CTX and THEMIS footprints as WFS layers
      var ctxSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) { 
          return "https://astro-geoserver.wr.usgs.gov/geoserver/upc/ows?service=WFS&version=1.0.0&srs=EPSG%3A4326"
                 + "&request=GetFeature&typeName=upc:mars_ctx&outputFormat=application%2Fjson&maxFeatures=200"
                 + `&CQL_FILTER=solarlongitude+BETWEEN+${sliderMin}+AND+${sliderMax} AND BBOX(isisfootprint, + ${extent.join(',')})`;
        },
        strategy: ol.loadingstrategy.bbox,
        wrapX: false,
      });
      var ctxOverlay = new ol.layer.Vector({
        title: 'WFS',
        source: ctxSource,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
           color: "rgba(0, 0, 255, .25)"
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 1.0)',
            width: 2
          })
        })
      });
      overlays.push(ctxOverlay);
      this.footprintLayers.push(ctxOverlay);

      var themisSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) { 
          return "https://astro-geoserver.wr.usgs.gov/geoserver/upc/ows?service=WFS&version=1.0.0"
                 + "&request=GetFeature&typeName=upc:mars_themis&outputFormat=application%2Fjson"
                 + "&maxFeatures=200&bbox=" + extent.join(',') + ',' + thisContext.projection;
        },
        strategy: ol.loadingstrategy.bbox,
        wrapX: false,
      });
      var themisOverlay = new ol.layer.Vector({
        title: 'WFS',
        source: themisSource,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
           color: "rgba(255, 0, 0, .25)"
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(255, 0, 0, 1.0)',
            width: 2
          })
        })
      });
      overlays.push(themisOverlay);
      this.footprintLayers.push(themisOverlay);


      document.getElementById("solarLongMin").addEventListener("change", function() {
        var sliderMin = document.getElementById("solarLongMin").value;
        var sliderMax = document.getElementById("solarLongMax").value;
        console.log(sliderMin);

        ctxSource = new ol.source.Vector({
          format: new ol.format.GeoJSON(),
          url: function(extent) { 
            return "https://astro-geoserver.wr.usgs.gov/geoserver/upc/ows?service=WFS&version=1.0.0&srs=EPSG%3A4326"
                   + "&request=GetFeature&typeName=upc%3Amars_ctx&outputFormat=application%2Fjson&maxFeatures=1000"
                   + `&CQL_FILTER=solarlongitude+BETWEEN+${sliderMin}+AND+${sliderMax} AND BBOX(isisfootprint, + ${extent.join(',')})`;
          },
          strategy: ol.loadingstrategy.bbox,
          wrapX: false,
        });
        ctxOverlay.setSource(ctxSource);
      });
      document.getElementById("solarLongMax").addEventListener("change", function() {
        var sliderMin = document.getElementById("solarLongMin").value;
        var sliderMax = document.getElementById("solarLongMax").value;

        ctxSource = new ol.source.Vector({
          format: new ol.format.GeoJSON(),
          url: function(extent) { 
            return "https://astro-geoserver.wr.usgs.gov/geoserver/upc/ows?service=WFS&version=1.0.0&srs=EPSG%3A4326"
                   + "&request=GetFeature&typeName=upc%3Amars_ctx&outputFormat=application%2Fjson&maxFeatures=1000"
                   + `&CQL_FILTER=solarlongitude+BETWEEN+${sliderMin}+AND+${sliderMax} AND BBOX(isisfootprint, + ${extent.join(',')})`;
          },
          strategy: ol.loadingstrategy.bbox,
          wrapX: false,
        });
        ctxOverlay.setSource(ctxSource);
      });
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
