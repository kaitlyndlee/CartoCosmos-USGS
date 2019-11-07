/**
 * @fileOverview Contains the class GeometryHelper and JSON defining
 * proj4 strings to be used when instantiating a PlanetaryMap.
 * 
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */


/*
 * Stores proj4 proj-strings for the different projections we support for each target.
 * Because MapServer, what we query to get the WMS tiles for the map, only accepts Earth 
 * codes, all projections are defined with Earth codes, but the rest of the proj-string 
 * is defined correctly for that target. 
 *
 * For example, the Mars north-polar stereographic projection is given the code EPSG:32661
 * but is defined with the correct radii 3396190 and 3396190 for Mars.
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
 * between ographic and ocentric latitudes. Refactored version of AstroWebMaps, our 
 * OpenLayers 4 implementation. 
 * 
 * Methods in this class need to be static because they are being used
 * in the MouseControl instantiation in PlanetaryMap. We cannot use "this" to refer to
 * the PlanetaryMap object inside of the MouseControl instantiation as "this" refers
 * to the mouse in that scope, not the map. Thus, there is no way to reference
 * a GeometryHelper PlanetaryMap member class variable in that scope.
 *
 * This class should never need to be instantiated because all methods may be called
 * statically. For example,
 *   GeometryHelper.transform180180To0360(...);
 */
class GeometryHelper {

  static majorRadius = null;
  static minorRadius = null;

  // static transform180180To0360(point) {
  //   var x = point[0];
  //   if (x < 0) {point[0] = x + 360;}
  //   return point;
  // }
  
  /*
   * Converts coordinate from -180/180 to 0/360 lon domain.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */
  static transform180180To0360(point) {
    var lon = point[0];
    lon = ((360 + (lon % 360)) % 360);
    return [lon, point[1]];
  } 
  
  // static transform0360To180180(point) {
  //   var x = point[0];
  //   if (x > 180) {point[0] = x - 360;}
  //   return point;
  // }
  

  /*
   * Converts coordinate from 0/360 to -180/180 lon domain.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */
  static transform0360To180180(point) {
    var lon = point[0];
    if(lon > 180.0) {
        lon -= 360.0;
    }
    return [lon, point[1]];
  }

  // static transformDatelineShift(point) {
  //   point[0] = point[0] + 360;
  //   return point;
  // }

  // static transformDatelineUnShift(point) {
  //     point[0] = point[0] - 360;
  //     return point;
  // }

  // static transformDanglers(point) {
  //   var x = point[0];
  //   while (x < 0) {x = x + 360;}
  //   while (x > 360) {x = x - 360;}
  //   point[0] = x;
  //   return point;
  // }


  // no reversal - works both ways
  // static transformPosEastPosWest(point) {
  //     point[0] = 360 - point[0];
  //     return point;
  // }
  

  /*
   * Converts coordinate from positive east to
   * positive west and vice versa. 
   * This operation is reversible.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */
  static transformLonDirection(point) {
    var lon = -1 * point[0];

    // If the lon domain is 0-360, lon may become out of range
    // (e.g. since 270 * -1 = -270 gets outside the range)
    if(lon < -180.0) {
      long += 360.0
    }
    return [lon, point[1]];
  }


  /*
   * Converts coordinate from planetocentric lat
   * to planetographic lat.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */  
  static transformOcentricToOgraphic(point) {
    // Convert to radians
    var lat = point[1] * Math.PI / 180;

    var squaredRatio = Math.pow((GeometryHelper.majorRadius / GeometryHelper.majorRadius), 2);
    lat = Math.atan(Math.tan(lat) * squaredRatio);
    
    // Convert back to degrees
    lat = lat * 180 / Math.PI;
    return [point[0], lat];
  } 
  

  /*
   * Converts coordinate from planetographic lat
   * to planetocentric lat.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */  
  static transformOgraphicToOcentric(point) {
    // Convert to radians
    var lat = point[1] * Math.PI / 180;

    var squaredRatio = Math.pow((GeometryHelper.minorRadius / GeometryHelper.majorRadius), 2);
    lat = Math.atan(Math.tan(lat) * squaredRatio);
    
    // Convert back to degrees
    lat = newY * 180 / Math.PI;
    return [point[0], lat];
  }
}

