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
          },
          "worldExtent": {
            "left": 0,
            "right": 60,
            "top": 360,
            "bottom": 90
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
          },
          "worldExtent": {
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
          },
          "worldExtent": {
            "left": 0,
            "right": -90,
            "top": 360,
            "bottom": -60
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

  /*
   * Converts coordinate from -180/180 to 0/360 lon domain.
   *
   * @param {array} point - 2D Array storing [lon, lat]
   */
  static transform180180To0360(point) {
    var lon = point[0];
    lon = lon-180;
    lon = ((360 + (lon % 360)) % 360);
    return [lon, point[1]];
  }


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

  /*
   * Cleans up the WKT string by removing unnecessary whitespace from beginning and
   * end of string, as well as any whitespace between text and an opening parenthesis.
   *
   * For example, '  MULTIPOINT ((10 10), (45 45))  ' will become 'MULTIPOINT((10 10),(45 45))'.
   *
   * Taken from AstroWebMaps
   *
   * @param {ol.format.wkt} wkt - the wkt string to be cleaned.
   *
   * @return {ol.format.wkt} the clean wkt string
   */
  static cleanWkt(wkt) {
    // trim
    wkt = wkt.replace(/^\s+|\s+$/g, "");

    // remove whitespace between geometry type and paren
    return wkt.replace(/\s+\(/g, "(");
  }

  /*
   * Warps a geometry by adding extra points along the edges. Helps to maintain
   * shape on reprojections. Supported geometry types include POINT, MULTIPOINT,
   * POLYGON, MULTIPOLYGON, LINESTRING, MULTILINESTRING.
   *
   * Note: Polygons and MultiPolygons containing holes (interior rings) are not supported.
   *
   * Taken from AstroWebMaps
   *
   * @param {ol.format.wkt} wkt - WKT to warp
   *
   * @return {ol.format.wkt} the warped WKT
   */
  static warpWkt(wkt) {
    // extract the geometry type (prefix)
    var wktPrefix = this.extractGeometryType(wkt);

    if ((wktPrefix == "POINT") || (wktPrefix == "MULTIPOINT")) {
      return wkt;
    }
    else if (wktPrefix == "POLYGON") {
      // extract points from wkt (ONLY WORKS FOR SIMPLE POLYGONS WITHOUT HOLES)
      var points = wkt.slice(9, wkt.length - 2).split(',');

      if (points.length <= 16) {
        var newPoints = this.saturatePointArray(points);
        // return warped wkt
        return "POLYGON((" + newPoints.join() + "))";
      }
      else {
        // we don't need to warp because there are too many points
        return wkt;
      }
    }
    else if (wktPrefix == "LINESTRING") {
      var points = wkt.slice(11, wkt.length - 1).split(',');

      if (points.length <= 16) {
        var newPoints = this.saturatePointArray(points);
        return "LINESTRING(" + newPoints.join() + ")";
      }
      else {
        return wkt;
      }
    }
    else if (wktPrefix == "MULTIPOLYGON") {
      // parse wkt
      var wktParser = new ol.format.WKT();
      var multiGeometry = wktParser.readGeometry(wkt);

      // grab individual polygons that comprise this geometry and warp them
      var polys = multiGeometry.getPolygons();
      var polyArray = [];

      for (var i = 0, len = polys.length; i < len; i++) {
        var points = polys[i].getCoordinates();
        var pointsF = [];
        points = points[0];

        for (var j = 0, pLen = points.length; j < pLen; j++) {
          pointsF[j] = points[j][0] + ' ' + points[j][1];
        }

        if (points.length <= 16) {
          var newPoints = this.saturatePointArray(pointsF);
          polyArray[i] = "((" + newPoints.join() + "))";
        }
        else {
          polyArray[i] = "((" + pointsF.join() + "))";
        }
      }
      return "MULTIPOLYGON(" + polyArray.join() + ")";
    }
    else if (wktPrefix == "MULTILINESTRING") {
      var wktParser = new OpenLayers.Format.WKT();
      var multiFeature = wktParser.read(wkt);

      var lines = multiFeature.getGeometry().components;
      var lineArray = [];
      for (var i = 0, len = lines.length; i < len; i++) {
        var linesStr = lines[i].toString();
        var points = linesStr.slice(11, linesStr.length - 1).split(',');

        if (points.length <= 16) {
          var newPoints = this.saturatePointArray(points);
          lineArray[i] = "(" + newPoints.join() + ")";
        }
        else {
          lineArray[i] = "(" + points.join() + ")";
        }
      }
      return "MULTILINESTRING(" + lineArray.join() + ")";
    }
    else {
      // unsupported geometry type, so just return it
      return wkt;
    }
  }

  /*
   * Extracts the geometry type from the WKT string. For example, if the WKT string is
   * 'POINT(7 10)', 'POINT' will be returned. Assumes the WKT has already been cleaned up
   * (see AstroGeometry.cleanWkt() for more details).
   *
   * Taken from AstroWebMaps
   *
   * @param {ol.format.wkt} wkt - the wkt string
   *
   * @return {ol.format.wkt} the geometry type string or null if bad WKT
   */
  static extractGeometryType(wkt) {
    var prefixEnd = wkt.indexOf("(");
    if (prefixEnd == -1) {
      return null;
    }
    return wkt.substring(0, prefixEnd);
  }

/*
 * Fills an array of points, helps to maintain shapes on reprojections.
 *
 * Taken from AstroWebMaps
 *
 * @param {array} pointArray - array of points.
 *
 * @return {array} array of new points.
 */
  static saturatePointArray(pointArray) {
    var newPointArray = [];
    var n = 0;

    for(var i = 0, len = (pointArray.length - 1); i < len; i++) {
      var latlon = pointArray[i].toString().replace(/^\s+|\s+$/g,'').split(' ');
      var nextlatlon = pointArray[i+1].toString().replace(/^\s+|\s+$/g,'').split(' ');
      var skipPoint = false;

      // Skip duplicate points
      if ( (Number(latlon[0]) == Number(nextlatlon[0])) && (Number(latlon[1]) == Number(nextlatlon[1])) )    {
        skipPoint = true;
      }
      //line to pole
      if ( ((latlon[0] == 0) || (latlon[0] == 360)) && ((nextlatlon[0] == 0) || (nextlatlon[0] == 360)) )   {
        skipPoint = true;
      }
      if (skipPoint){
        newPointArray[n] = [pointArray[i]];
        n += 1;
        continue;
      }
      var midLon = (Number(latlon[0])+Number(nextlatlon[0]))/2;
      var midLat = (Number(latlon[1])+Number(nextlatlon[1]))/2;
      var qLon = (Number(latlon[0])+Number(midLon))/2;
      var qLat = (Number(latlon[1])+Number(midLat))/2;
      var qqqLon = (Number(nextlatlon[0])+Number(midLon))/2;
      var qqqLat = (Number(nextlatlon[1])+Number(midLat))/2;
      var eLon = (Number(latlon[0])+Number(qLon))/2;
      var eLat = (Number(latlon[1])+Number(qLat))/2;
      var eeeLon = (Number(midLon)+Number(qLon))/2;
      var eeeLat = (Number(midLat)+Number(qLat))/2;
      var eeeeeLon = (Number(midLon)+Number(qqqLon))/2;
      var eeeeeLat = (Number(midLat)+Number(qqqLat))/2;
      var eeeeeeeLon = (Number(nextlatlon[0])+Number(qqqLon))/2;
      var eeeeeeeLat = (Number(nextlatlon[1])+Number(qqqLat))/2;
      newPointArray[n] = [pointArray[i]];
      newPointArray[n+1] = [((Number(latlon[0])+eLon)/2)+' '+(Number(latlon[1])+eLat)/2];
      newPointArray[n+2] = [eLon+' '+eLat];
      newPointArray[n+3] = [((Number(qLon)+eLon)/2)+' '+(Number(qLat)+eLat)/2];
      newPointArray[n+4] = [qLon+' '+qLat];
      newPointArray[n+5] = [((Number(qLon)+eeeLon)/2)+' '+(Number(qLat)+eeeLat)/2];
      newPointArray[n+6] = [eeeLon+' '+eeeLat];
      newPointArray[n+7] = [((Number(midLon)+eeeLon)/2)+' '+(Number(midLat)+eeeLat)/2];
      newPointArray[n+8] = [midLon+' '+midLat];
      newPointArray[n+9] = [((Number(midLon)+eeeeeLon)/2)+' '+(Number(midLat)+eeeeeLat)/2];
      newPointArray[n+10] = [eeeeeLon+' '+eeeeeLat];
      newPointArray[n+11] = [((Number(qqqLon)+eeeeeLon)/2)+' '+(Number(qqqLat)+eeeeeLat)/2];
      newPointArray[n+12] = [qqqLon+' '+qqqLat];
      newPointArray[n+13] = [((Number(qqqLon)+eeeeeeeLon)/2)+' '+(Number(qqqLat)+eeeeeeeLat)/2];
      newPointArray[n+14] = [eeeeeeeLon+' '+eeeeeeeLat];
      newPointArray[n+15] = [((Number(nextlatlon[0])+eeeeeeeLon)/2)+' '+(Number(nextlatlon[1])+eeeeeeeLat)/2];
      n += 16;
    }
    newPointArray[n] = [pointArray[i]];
    return (newPointArray);
  }
}
