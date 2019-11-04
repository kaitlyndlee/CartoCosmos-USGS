/**
 * @fileOverview Contains the class AstroGeometry and JSON defining
 * proj4 strings to be used when instantiating a PlanetaryMap.
 * 
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */


projectionDefs = {  
  "targets":[
    {
      "name": "mars",
      "projections": [
        {
          "name": "north-polar stereographic",
          "code": "EPSG:32661",
          "string": "+proj=stere +lat_0=90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=3396190 +b=3396190 +units=m +no_defs",
          "extent": {
            "left": -2357032,
            "right": 2357032,
            "top": 2357032,
            "bottom": -2357032
          }
        },
        {
          "name": "cylindrical",
          "code": "EPSG:4326",
          "string": "+proj=longlat +a=3396190 +b=3396190 +no_defs",
          "extent": {
            "left": -180,
            "right": 180,
            "top": 90,
            "bottom": -90
          }
        },
        {
          "name": "south-polar stereographic",
          "code": "EPSG:32761",
          "string": "+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=3396190 +b=3376200 +units=m +no_defs",
          "extent": {
            "left": -2357032,
            "right": 2357032,
            "top": 2357032,
            "bottom": -2357032
          }
        }
      ] 
    }
  ]
}


/*
 * This utility class provides geometry helper methods such as converting
 * between ographic and ocentric latitudes. Taken from AstroWebMaps, our 
 * OpenLayers 4 implementation.
 *
 * This class should never need to be instantiated because all methods may be called
 * statically. For example,
 *   AstroGeometry.saturatePointArray(...);
 */
class AstroGeometry {

  static transform180180To0360(point) {
    var x = point[0];
    if (x < 0) {point[0] = x + 360;}
    return point;
  }

  static transform0360To180180(point) {
    var x = point[0];
    if (x > 180) {point[0] = x - 360;}
    return point;
  }

  static transformDatelineShift(point) {
    point[0] = point[0] + 360;
    return point;
  }

  static transformDatelineUnShift(point) {
      point[0] = point[0] - 360;
      return point;
  }

  static transformDanglers(point) {
    var x = point[0];
    while (x < 0) {x = x + 360;}
    while (x > 360) {x = x - 360;}
    point[0] = x;
    return point;
  }


  // no reversal - works both ways
  static transformPosEastPosWest(point) {
      point[0] = 360 - point[0];
      return point;
  }

  static transformOcentricToOgraphic(point, aaxisradius, caxisradius) {
    var newY = point[1] * Math.PI / 180;
    newY = Math.atan(Math.tan(newY) * (aaxisradius / caxisradius) * (aaxisradius / caxisradius));
    newY = newY * 180 / Math.PI;
    point[1] = newY;
    return point;
  }

  static transformOgraphicToOcentric(point, aaxisradius, caxisradius) {
    var newY = point[1] * Math.PI / 180;
    newY = Math.atan(Math.tan(newY) * (caxisradius / aaxisradius) * (caxisradius / aaxisradius));
    newY = newY * 180 / Math.PI;
    point[1] = newY;
    return point;
  }

}

