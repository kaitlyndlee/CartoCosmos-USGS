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
   * 
   * @constructor
   *
   */
  constructor(map, source) {
    this.map = map;
    this.source = source;
    this.savedFeatures = [];
  }

  //Save as cylindrical for easy save
  saveShape(wkt) {
    var vectorState = this.drawFeature(wkt, {});
    this.savedFeatures.push(vectorState);
    return vectorState;
  }


/*
 */
  drawFeature(wkt, vectorState) {
    // var vectorState = {};
    var projCode = this.map.getView().getProjection().getCode();

    // clean up WKT in case there is extra unnecessary whitespace
    wkt = GeometryHelper.cleanWkt(wkt);

    if(vectorState.cylindricalWKT == null) {
      vectorState.cylindricalWKT = wkt;  //proj dependent, used for drawing on map
    }
    var format = new ol.format.WKT();

    // Warp shapes when our projection is not cylindrical
    if(projCode != "EPSG:4326") {
      var geometry = format.readGeometry(vectorState.cylindricalWKT);
      var polygon = format.writeGeometry(geometry, {decimals: 2});
      var wktWarp = GeometryHelper.warpWkt(polygon);

      // Read geometry so that we can transform back to the correct projection
      var geometryWarp = format.readGeometry(wktWarp);
      if (projCode == 'EPSG:32661' && vectorState.northPolarWKT == null) {
        geometryWarp = geometryWarp.transform('EPSG:4326', 'EPSG:32661');
        vectorState.northPolarWKT = format.writeGeometry(geometryWarp, {decimals: 2});
      } 
      else if(projCode == 'EPSG:32761' && vectorState.SouthPolarWKT == null) {
        geometryWarp = geometryWarp.transform('EPSG:4326','EPSG:32761');
        vectorState.SouthPolarWKT = format.writeGeometry(geometryWarp, {decimals: 2});
      }
    }
    var vector = format.readFeature(vectorState.cylindricalWKT);
    var currentWKT = vectorState.cylindricalWKT;
    if(projCode == "EPSG:32661") {
      vector = format.readFeature(vectorState.northPolarWKT);
      currentWKT = vectorState.northPolarWKT;
    }
    else if(projCode == "EPSG:32761") {
      vector = format.readFeature(vectorState.SouthPolarWKT);
      currentWKT = vectorState.noSouthPolarWKTrthPolarWKT;
    }
    console.log("PROJ: " + projCode, " WKT: " + currentWKT);
    vectorState.vectorFeature = vector;

    // draw vector
    this.source.addFeature(vector);
    document.getElementById('polygonWKT').value = currentWKT;
    return vectorState;
  }

  setSource(newSource) {
    this.source = newSource;
  }

  setMap(newMap) {
    this.map = newMap;
  }

  redrawFeature() {
    var vectorState;
    var currentVector;
    for (var i = 0; i < this.savedFeatures.length; i++) {
      currentVector = this.savedFeatures[i];
      this.drawFeature(currentVector.cylindricalWKT, currentVector);
    }
  }


  removeFeatures() {
    for (var i = 0; i < this.savedFeatures.length; i++) {
      this.savedFeatures.pop();
    }
    this.source.clear();
    document.getElementById('polygonWKT').value = "";
  }
}
