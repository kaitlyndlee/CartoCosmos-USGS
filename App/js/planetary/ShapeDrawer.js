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
  saveShape(wkt, id) {
    var vectorState = this.drawFeature(wkt, id);
    vectorState.index = this.savedFeatures.length;
    this.savedFeatures.push(vectorState);
    return vectorState;
  }


/*
 */
  drawFeature(wkt, id) {
    var vectorState = {};

    // clean up WKT in case there is extra unnecessary whitespace
    wkt = GeometryHelper.cleanWkt(wkt);

    // save state
    vectorState.drawWKT = wkt;  //proj dependent, used for drawing on map
    vectorState.id = id;
    var format = new ol.format.WKT();
    var vector = format.readFeature(vectorState.drawWKT);
    vectorState.vectorFeature = vector;

    // draw vector
    this.source.addFeature(vector);
    return vectorState;
  }

  setSource(newSource) {
    this.source = newSource;
  }

  setMap(newMap){
    this.map = newMap;
  }

  redrawFeature() {
    for (var i = 0; i < this.savedFeatures.length; i++) {
      if (!this.savedFeatures[i]) {
        continue;
      }
      console.log(this.savedFeatures[i]);
      var currentVector = this.savedFeatures[i];
      var format = new ol.format.WKT();
      var vector = format.readFeature(currentVector.drawWKT);
      this.source.addFeature(vector);
      
      // var currentGeo = currentVector.vectorFeature.getGeometry();
      // // if (this.isDrawable(currentGeo)) {
      //   //var color = (currentVector) ? currentVector.color : null;
      //   var vectorState = this.draw(currentVector.drawWKT, currentVector.id);
      //   // update stored vector state
      //   this.savedFeatures[i] = vectorState;
      // }
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
