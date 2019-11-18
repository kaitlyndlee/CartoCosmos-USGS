/**
 * @fileOverview Contains the class ShapeDrawer.
 * 
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */

/*
 */
class ShapeDrawer {

  /**
   * Stores and draws boxes and polygons as selected by the user. 
   * 
   * Note: in OL, when you draw a shape on the map, it is saved as a feature.
   * 
   * @constructor
   *
   * @param {OL.Map} map - OpenLayers map object that is contained in PlanetaryMap.
   * @param {OL.Source.Vector} source - The source to be drawn to
   */
  constructor(map, source) {
    this.map = map;
    this.source = source;
    this.savedFeatures = [];
  }


  /*
   * Saves the state of the feature to be drawn by adding
   * it to the savedFeatures list so that when we swap projections,
   * the feature will be redrawn to the map.
   *
   * @param {OL.Format.WKT} wkt - Well Known Text representing the 
   *                        feature to be saved and drawn.
   */
  saveShape(wkt) {
    var featureState = this.drawFeature(wkt, {});
    this.savedFeatures.push(featureState);
  }


  /*
   * Creates the feature state to be drawn that stores a WKT for each projection and
   * draws the feature on the map by adding it to the source. By default, we store
   * the WKT in EPSG:4326. If the current map projections is not EPSG:4326, then
   * we must warp the geomtery to better form to the projection. As we swap projections,
   * the WKT of the geometry is saved in the feature state for future use. Writes the WKT to the
   * WKT text box.
   *
   * @param {OL.Format.WKT} wkt - Well Known Text representing the 
   *                              feature to be saved and drawn.
   *
   * @param {object} featureState - Key-Value pair storing the feature state of the 
   *                                feature we are trying to draw on the map.
   *
   * @return {object} Key-Value pair of the new feature state that was just created.
   */
  drawFeature(wkt, featureState) {
    var projCode = this.map.getView().getProjection().getCode();

    // clean up WKT in case there is extra unnecessary whitespace
    wkt = GeometryHelper.cleanWkt(wkt);

    if(featureState.cylindricalWKT == null) {
      featureState.cylindricalWKT = wkt;
    }

    var format = new ol.format.WKT();

    // Warp shapes when our projection is not EPSG:4326
    if(projCode != "EPSG:4326") {
      var geometry = format.readGeometry(featureState.cylindricalWKT);
      var polygon = format.writeGeometry(geometry, {decimals: 2});
      var wktWarp = GeometryHelper.warpWkt(polygon);

      // Read geometry so that we can transform back to the correct projection
      var geometryWarp = format.readGeometry(wktWarp);
      if (projCode == 'EPSG:32661' && featureState.northPolarWKT == null) {
        geometryWarp = geometryWarp.transform('EPSG:4326', 'EPSG:32661');
        featureState.northPolarWKT = format.writeGeometry(geometryWarp, {decimals: 2});
      } 
      else if(projCode == 'EPSG:32761' && featureState.SouthPolarWKT == null) {
        geometryWarp = geometryWarp.transform('EPSG:4326','EPSG:32761');
        featureState.SouthPolarWKT = format.writeGeometry(geometryWarp, {decimals: 2});
      }
    }
    // Write out the feature to be drawn on the map
    var feature = format.readFeature(featureState.cylindricalWKT);
    var currentWKT = featureState.cylindricalWKT;
    if(projCode == "EPSG:32661") {
      feature = format.readFeature(featureState.northPolarWKT);
      currentWKT = featureState.northPolarWKT;
    }
    else if(projCode == "EPSG:32761") {
      feature = format.readFeature(featureState.SouthPolarWKT);
      currentWKT = featureState.noSouthPolarWKTrthPolarWKT;
    }
    featureState.storedFeature = feature;

    // draw feature
    this.source.addFeature(feature);
    document.getElementById('polygonWKT').value = currentWKT;
    return featureState;
  }


  /*
   * Sets the source variable. Used mainly when a projection change occurs.
   *
   * @oaram {OL.Source.Vector} newSource - New vector source.
   */
  setSource(newSource) {
    this.source = newSource;
  }


  /*
   * Sets the map variable.
   *
   * @oaram {OL.Map} newMap - New map.
   */
  setMap(newMap) {
    this.map = newMap;
  }


  /*
   * When a projection switch occurs, grab the currently drawn feature and
   * redraw it on the new source. Uses the cylindrical WKT by default.
   */
  redrawFeature() {
    var currentFeature;
    for (var i = 0; i < this.savedFeatures.length; i++) {
      currentFeature = this.savedFeatures[i];
      this.drawFeature(currentFeature.cylindricalWKT, currentFeature);
    }
  }


  /*
   * Clears the savedFeaures list, clears any features from the map, and
   * clears the WKT text box.
   */
  removeFeatures() {
    for (var i = 0; i < this.savedFeatures.length; i++) {
      this.savedFeatures.pop();
    }
    this.source.clear();
    document.getElementById('polygonWKT').value = "";
  }


  /*
   * Stores the WKT in EPSG:4326 and saves the new shape. Called by
   * this.draw().
   *
   * @param {OL.Format.WKT} wkt - Well Known Text representing the 
   *                        feature to be saved and drawn.
   */
  drawFromButton(wkt) {
    // Save all wkt in cylindrical for easy projection switches
    var projCode = this.map.getView().getProjection().getCode();
    if (projCode != 'EPSG:4326') {
      var format = new ol.format.WKT();
      var geometry = format.readGeometry(wkt);
      if (projCode == 'EPSG:32661') {
        geometry = geometry.transform('EPSG:32661','EPSG:4326');
      } 
      else {
        geometry = geometry.transform('EPSG:32761','EPSG:32761');
      }
      wkt = format.writeGeometry(geometry);

    }
    this.saveShape(wkt);
  }


  /*
   * Creates the draw interaction that allows users
   * to draw shapes on the map and adds listeners for when
   * the user starts and ends drawing. When the user starts drawing,
   * remove any shapes that are drawn on the map since we should only
   * have one shape at a time. When a user stops drawing, save the
   * shape by calling this.drawFromButton(). Then, we remove the draw interaction.
   *
   * Called when the 'Draw Shape' button is clicked by the user.
   *
   * @oaram {string} shape - String that stores the type of shape to draw
   *                         Possible values are Box and Polygon.
   */
  draw(shape) {
    var shapeDraw;
    if(shape == "Box") {
      shapeDraw = new ol.interaction.Draw({
        type: "Circle",
        source: this.source,
        geometryFunction: ol.interaction.Draw.createBox()
      });
    }
    else {
      shapeDraw = new ol.interaction.Draw({
        type: "Polygon",
        source: this.source,
      });
    }
    this.map.addInteraction(shapeDraw);
    
    // Store this context so that it is accessible inside of the
    // drawstart and drawend listeners
    var drawInteraction = this;

    var format = new ol.format.WKT();
    shapeDraw.on('drawstart', function(e) {
      drawInteraction.removeFeatures();
    });

    shapeDraw.on('drawend', function(e) {
      var wkt = format.writeFeature(e.feature);
      drawInteraction.drawFromButton(wkt);
      drawInteraction.map.removeInteraction(this);
    });
  }
}
