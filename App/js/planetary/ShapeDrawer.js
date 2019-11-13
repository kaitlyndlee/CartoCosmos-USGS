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
    // var currentProjection = this.map.projName;

    // clean up WKT in case there is extra unnecessary whitespace
    wkt = GeometryHelper.cleanWkt(wkt);

    // save state
    vectorState.drawWKT = wkt;  //proj dependent, used for drawing on map
    vectorState.id = id;
    // vectorState.searchWKT = ""; //lat-lon, used for searching
    // vectorState.splitWKT = ""; //lat-lon, used for searching
   
    var format = new ol.format.WKT();
    var geometry = format.readGeometry(wkt);

    // if(currentProjection == "cylindrical") {
      
    // //   var extent = geometry.getExtent();
    // //   var brX = ol.extent.getBottomRight(extent)[0];
    // //   var blX = ol.extent.getBottomLeft(extent)[0];
    // //   var exWidth = ol.extent.getWidth(extent);

    // //   if( (exWidth > 360) || ((brX > 360) && (blX > 360)) || ((brX < 0) && (blX < 0)) ) {
    // //     wkt = AstroGeometry.undangle(wkt);
    // //   }
    // //   vectorState.searchWKT = wkt;
    // //   if (AstroGeometry.crossesDateline(wkt, currentProjection)) {
    // //     vectorState.splitWKT = AstroGeometry.splitOnDateline(wkt, currentProjection);
    // //   }
    // //   if (datelineShift) {
    // //     vectorState.drawWKT = AstroGeometry.datelineShift(wkt);
    // //   }
    // } 
    // else {
    //   //polar
    //   var wktWarp  = format.writeGeometry(geometry, {decimals: 2});
    //   // vectorState.searchWKT = wktLatLon;
    //   // if (AstroGeometry.crossesDateline(wkt, currentProjection)) {
    //   //   vectorState.splitWKT = AstroGeometry.splitOnDateline(wktLatLon, currentProjection);
    //   //   wktWarp = AstroGeometry.warpWkt(vectorState.splitWKT);
    //   // } 
    //   // else {
    //     // wktWarp = AstroGeometry.warpWkt(wktLatLon);
    //   // }
    //   var geometryWarp = format.readGeometry(wktWarp);
    //   // if (currentProjection == "north-polar stereographic") {
    //   //   geometryWarp = geometryWarp.transform('EPSG:4326','EPSG:32661');
    //   // } else {
    //   //   geometryWarp = geometryWarp.transform('EPSG:4326','EPSG:32761');
    //   // }
    //   vectorState.drawWKT = format.writeGeometry(geometryWarp, {decimals: 2});
    // }

    //console.log('AV wkt draw ' + vectorState.drawWKT);
    //console.log('AV wkt search ' + vectorState.searchWKT);
    //console.log('AV wkt split ' + vectorState.splitWKT);

    // save state:
    var vector = format.readFeature(vectorState.drawWKT);
    // vector.attributes = attributes;
    // vector.attributes.color = color;
    // vector.data = attributes;
    vectorState.vectorFeature = vector;

    // if (color) {
    //   if (!this.styles[color]) {
    //     var currentStyle = new ol.style.Style({
    //      fill: new ol.style.Fill({
    //              color: this.convertHexColor(color, .2)
    //            }),
    //      stroke: new ol.style.Stroke({
    //                  color: this.convertHexColor(color, 1)
    //                })
    //           });
    //     this.styles[color] = currentStyle;
    //   }
    //   vector.setStyle(this.styles[color]);
    // }


    // draw vector
    this.source.addFeature(vector);
    // //center on vector
    // if ((center) && (this.astroMap.mapsLoaded)) {
    //   this.centerOnVector(vector);

    // }
    return vectorState;
  }

  updateSource(newSource) {
    this.source = newSource;
  }

  updateMap(newMap){
    this.map = newMap;
  }

  redrawFeature() {
    for (var i = 0; i < this.savedFeatures.length; i++) {
      if (!this.savedFeatures[i]) {
        continue;
      }
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
    console.log(this.savedFeatures);
  }
}
