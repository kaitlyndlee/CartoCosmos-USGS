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
// parseWebAtlas();
var planetaryMap = new PlanetaryMap('mars', 'cylindrical');

/*
 * Creates divs for projections, lon directons, lon domains, and
 * lat types.
 */
function createControls() {
  var controlsDiv = document.getElementById('controls');
  var mapOptions = document.getElementById("map-controls");
  var drawOptions = document.getElementById("draw-controls");

  var projectionSelect = document.createElement("select");
  projectionSelect.id = "projSelect";
  projectionSelect.onchange = function(){switchProjection(projectionSelect.value);};
  var projectionList = document.createElement("li");
  mapOptions.appendChild(projectionList.appendChild(projectionSelect));

  var projOptions = ["Cylindrical", "North-polar Stereographic", "South-polar Stereographic"];
  for(var i = 0; i < projOptions.length; i++){
    var option = document.createElement("option");
    option.value = projOptions[i];
    option.text = projOptions[i];
    projectionSelect.appendChild(option);
    projectionSelect.style.display = "none";
  }

  var lonDirectionSelect = document.createElement("select");
  lonDirectionSelect.id = "lonDirectionSelect";
  var lonDirList = document.createElement("li");
  mapOptions.appendChild(lonDirList.appendChild(lonDirectionSelect));

  var directions = ["Positive East", "Positive West"];
  for(var i = 0; i < directions.length; i++){
    var option = document.createElement("option");
    option.value = directions[i];
    option.text = directions[i];
    lonDirectionSelect.appendChild(option);
  }

  var lonDomainSelect = document.createElement("select");
  lonDomainSelect.id = "lonDomainSelect";
  var domainList = document.createElement("li");
  mapOptions.appendChild(domainList.appendChild(lonDomainSelect));

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
  var latList = document.createElement("li");
  mapOptions.appendChild(latList.appendChild(latSelect));

  var latOptions = ["Planetocentric", "Planetographic"];
  for(var i = 0; i < latOptions.length; i++){
    var option = document.createElement("option");
    option.value = latOptions[i];
    option.text = latOptions[i];
    latSelect.appendChild(option);
  }

  var drawShapeSelect = document.createElement("select");
  drawShapeSelect.id = "drawShapeDiv";
  var drawSelectList = document.createElement("li");
  drawOptions.appendChild(drawSelectList.appendChild(drawShapeSelect));

  var shapeWKTField = document.createElement("TextArea");
  // shapeWKTField.setAttribute("type", "text");
  shapeWKTField.rows = 3;
  shapeWKTField.cols = 100;
  shapeWKTField.id = "polygonWKT";
  shapeWKTField.size = 25;
  shapeWKTField.onkeyup = function(){
    if(event.key === 'Enter') {
      planetaryMap.shapeDrawer.drawFromTextBox();
    }
  };
  var shapeList = document.createElement("li");

  var shapes = ["Box", "Polygon"];
  for(var i = 0; i < shapes.length; i++){
    var option = document.createElement("option");
    option.value = shapes[i];
    option.text = shapes[i];
    drawShapeSelect.appendChild(option);
  }

  var drawShapeDiv = document.createElement("button");
  drawShapeDiv.innerHTML = "Draw Shape";
  drawShapeDiv.onclick = function(){planetaryMap.shapeDrawer.draw(drawShapeSelect.value);};
  var drawShapeList = document.createElement("li");
  drawOptions.appendChild(drawShapeList.appendChild(drawShapeDiv));

  var removeShapeDiv = document.createElement("button");
  removeShapeDiv.id = "removeBoxDiv";
  removeShapeDiv.innerHTML = "Remove Shape";
  removeShapeDiv.onclick = function(){planetaryMap.shapeDrawer.removeFeatures();};
  var removeList = document.createElement("li");
  drawOptions.appendChild(removeList.appendChild(removeShapeDiv));

  var lonLatTitle = document.createElement("div");
  lonLatTitle.className ='lonLatTitle';
  lonLatTitle.innerHTML = 'Lat Lon: &nbsp;';
  document.getElementById("lat-lon-div").appendChild(lonLatTitle);

  drawOptions.appendChild(shapeList.appendChild(shapeWKTField));

  createLonLatDiv();
}


/*
 * Creates div for displaying the current lon lat.
 */
function createLonLatDiv() {
  var controlsDiv = document.getElementById('lat-lon-div');
  var lonLatDiv = document.createElement("div");
  lonLatDiv.className ='lonLatMouseControl';
  lonLatDiv.id = "lonLat"
  controlsDiv.appendChild(lonLatDiv);
}


/*
 * Deletes and recreates the lon lat div.
 */
function refreshLonLatDiv() {
  var controlsDiv = document.getElementById('lat-lon-div');
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
