/**
 * @fileOverview Creates the PlanetaryMap Object that contains the OL map and adds
 * selects and divs to the map for the user to switch the projection, target, lat type,
 * and lon domain and direction.
 *
 * @author Kaitlyn Lee and Brandon Kindrick
 *
 * @history
 *   2019-09-23 Kaitlyn Lee and Brandon Kindrick - Original Version
 */

createControls();
var planetaryMap = new PlanetaryMap('mars', 'cylindrical');


/*
 * Creates divs for projections, lon directons, lon domains, and
 * lat types.
 */
function createControls() {
  var controlsDiv = document.getElementById('controls');

  var projectionSelect = document.createElement("select");
  projectionSelect.id = "projSelect";
  projectionSelect.onchange = function(){switchProjection(projectionSelect.value);};
  controlsDiv.appendChild(projectionSelect);

  var projOptions = ["Cylindrical", "North-polar Stereographic", "South-polar Stereographic"];
  for(var i = 0; i < projOptions.length; i++){
    var option = document.createElement("option");
    option.value = projOptions[i];
    option.text = projOptions[i];
    projectionSelect.appendChild(option);
  }

  var lonDirectionSelect = document.createElement("select");
  lonDirectionSelect.id = "lonDirectionSelect";
  controlsDiv.appendChild(lonDirectionSelect);

  var directions = ["Positive East", "Positive West"];
  for(var i = 0; i < directions.length; i++){
    var option = document.createElement("option");
    option.value = directions[i];
    option.text = directions[i];
    lonDirectionSelect.appendChild(option);
  }

  var lonDomainSelect = document.createElement("select");
  lonDomainSelect.id = "lonDomainSelect";
  controlsDiv.appendChild(lonDomainSelect);

  var domainsText = ["0\u00B0 to 360\u00B0", "-180\u00B0 to 180\u00B0\u00A0"];
  var domains = ["360", "180"];
  for(var i = 0; i < directions.length; i++){
    var option = document.createElement("option");
    option.value = domains[i];
    option.text = domainsText[i];
    lonDomainSelect.appendChild(option);
  }

  var latSelect = document.createElement("select");
  latSelect.id = "latSelect";
  controlsDiv.appendChild(latSelect);

  var latOptions = ["Planetocentric", "Planetographic"];
  for(var i = 0; i < latOptions.length; i++){
    var option = document.createElement("option");
    option.value = latOptions[i];
    option.text = latOptions[i];
    latSelect.appendChild(option);
  }

  var drawBoxDiv = document.createElement("button");
  drawBoxDiv.id = "drawBoxDiv";
  drawBoxDiv.innerHTML = "Draw Box";
  drawBoxDiv.onclick = function(){planetaryMap.boundingBoxDrawer.draw();};
  controlsDiv.appendChild(drawBoxDiv);

  var drawPolygonDiv = document.createElement("button");
  drawPolygonDiv.id = "drawPolygonDiv";
  drawPolygonDiv.innerHTML = "Draw Polygon";
  drawPolygonDiv.onclick = function(){planetaryMap.polygonDrawer.draw();};
  controlsDiv.appendChild(drawPolygonDiv);

  var removeBoxDiv = document.createElement("button");
  removeBoxDiv.id = "removeBoxDiv";
  removeBoxDiv.innerHTML = "Remove Box";
  removeBoxDiv.onclick = function(){planetaryMap.removeBoundingBox();};
  controlsDiv.appendChild(removeBoxDiv);

  var boundingBoxCoordinates = document.createElement("div");
  controlsDiv.appendChild(boundingBoxCoordinates);

  // var minLon = document.createElement("div");
  // minLon.id = "minLonWKT"
  // minLon.innerHTML = 'Min Lon: ';
  // boundingBoxCoordinates.appendChild(minLon);

  // var minLonBox = document.createElement("text");
  // minLonBox.id = "minLonWKTBox"
  // boundingBoxCoordinates.appendChild(minLonBox);

  var lonLatTitle = document.createElement("div");
  lonLatTitle.className ='lonLatTitle';
  lonLatTitle.innerHTML = 'Lat Lon: &nbsp;';
  controlsDiv.appendChild(lonLatTitle);

  createLonLatDiv();
}


/*
 * Creates div for displaying the current lon lat.
 */
function createLonLatDiv() {
  var controlsDiv = document.getElementById('controls');
  var lonLatDiv = document.createElement("div");
  lonLatDiv.className ='lonLatMouseControl';
  lonLatDiv.id = "lonLat"
  controlsDiv.appendChild(lonLatDiv);
}


/*
 * Deletes and recreates the lon lat div.
 */
function refreshLonLatDiv() {
  var controlsDiv = document.getElementById('controls');
  var lonLatDiv = document.getElementById('lonLat');
  controlsDiv.removeChild(lonLatDiv);
  createLonLatDiv();
}


/*
 * Switches the projection the OL map is currently displaying
 * by refreshing the lon lat div and calling the PlanetaryMap switchProjection
 * method. We have to refresh the lon lat div because it gets cloned every time
 * the projection is switched (for some reason).
 */
function switchProjection(newProjection) {
  refreshLonLatDiv();
  planetaryMap.switchProjection(newProjection);
}


// TODO Change this?
function parseWebAtlas() {
  var targets = [];

  var json = myJSONmaps['targets'];
  for(var i = 0; i < json.length; i++) {
    var currentTarget = String(json[i]);

    if(!targets.includes(currentTarget)){
      targets.push(String(currentTarget));
      targets = targets.sort();
    }
  }
}
parseWebAtlas();


function disableProjection(proj) {
  var projDiv = document.getElementById("projSelect").options;

  switch(proj) {
    case("north"):
      projDiv[1].disabled = true;
      break;

    case("south"):
      projDiv[2].disabled = true;
      break;
  }
}


function enableProjection(proj) {
  var projDiv = document.getElementById("projSelect").options;

  switch(proj) {
    case("north"):
      projDiv[1].disabled = false;
      break;

    case("south"):
      projDiv[2].disabled = false;
      break;
  }
}


function checkProjections(layers) {
  if(!layers["hasNorth"]) {
    disableProjection("north");
  } else {
    enableProjection("north");
  }

  if(!layers["hasSouth"]) {
    disableProjection("south");
  } else {
    enableProjection("south");
  }
}

//createControls();

var targetSelect = document.getElementById("target-select");
var targetSelectValue = targetSelect.value;
var projSelect = document.getElementById("projSelect");
var projSelectValue = projSelect.value;
//checkProjections(planetaryMap.layers);


function switchTarget(target) {
  planetaryMap.destroy();
  planetaryMap.target = target;
  planetaryMap.createMap(planetaryMap.parseWebAtlas());
  //checkProjections(planetaryMap.layers);
  //planetaryMap.switchProjection(String(projSelectValue));
}

targetSelect.onchange = function() {
  var target = String(targetSelect.options[targetSelect.selectedIndex].text).toLowerCase();
  document.getElementById("projSelect").options[0].selected = true;
  document.getElementById("projSelect").onchange();
  switchTarget(target);
  //planetaryMap.map.getView().getProjection());
}


//drawControls();
