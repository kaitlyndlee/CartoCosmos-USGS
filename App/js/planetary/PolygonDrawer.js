/**
 * @fileOverview Contains the class BoundingBoxDrawer.
 *
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */

/*
 */
class PolygonDrawer extends ShapeDrawer {

  /**
   * Creates a PlanetaryMap object by first parsing the WebAtlas JSON, then
   * creating the OpenLayers map instance.
   *
   * @constructor
   *
   * @param {string} target - The requested target to display the map for, i.e, Mars.
   * @param {string} projection - The requested projection to dispaly the map in.
   */
  // constructor(map, vectorSource) {
  //   this.map = map;
  //   this.vectorSource = vectorSource;
  // }


  draw() {
    var polygon = new ol.interaction.Draw({
      type: "Polygon",
      source: this.source
    });
    this.map.addInteraction(polygon);

    // this.vectorSource.on("addfeature", function(e) {
    //   var feature = e.feature;
    //   var format = new ol.format.WKT();
    //   var wkt = format.writeFeature(feature, {decimals: 2});
    //   console.log("GOT CALLED");
    //   // this.drawFromControl(wkt);
    // });

    // Store this context so that it is accessible inside of the
    // drawstart and drawend events
    var bbox = this;

    var format = new ol.format.WKT();
    polygon.on('drawstart', function(e) {
      bbox.removeFeatures();
    });

    polygon.on('drawend', function(e) {
      var wkt = format.writeFeature(e.feature);
      // var wkt = format.writeGeometry(e.feature.getGeometry());
      bbox.drawFromButton(wkt);
      bbox.map.removeInteraction(this);
    });
  }

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
      // // CHECK TO SEE IF IN BOUNDS
      // if (!AstroVector.prototype.isDrawable(geometry)) {
      //   alert('Bounding Box is not visible in this projection!');
      //   return null;
      // }
      wkt = format.writeGeometry(geometry);
      // document.getElementById('polygonWKT').value = wkt;

    }
    return this.saveShape(wkt);
  }

}
