function createControls() {
  var controlsDiv = document.getElementById('controls');

  var projectionSelect = document.createElement("select");
  projectionSelect.id = "projSelect";
  projectionSelect.onchange = function(){switchProjection(projectionSelect);};
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

  var lonLatTitle = document.createElement("div");
  lonLatTitle.className ='lonLatTitle';
  lonLatTitle.innerHTML = 'Lat Lon: &nbsp;';
  controlsDiv.appendChild(lonLatTitle);

  createLonLatDiv();
}


function createLonLatDiv() {
  var controlsDiv = document.getElementById('controls');
  var lonLatDiv = document.createElement("div");
  lonLatDiv.className ='lonLatMouseControl';
  lonLatDiv.id = "lonLat"
  controlsDiv.appendChild(lonLatDiv);
}


function refreshLatLonDiv() {
  var controlsDiv = document.getElementById('controls');
  var lonLatDiv = document.getElementById('lonLat');
  controlsDiv.removeChild(lonLatDiv);
  createLonLatDiv();
}


function switchProjection(newProjection) {
  refreshLatLonDiv();
  planetaryMap1.switchProjection(newProjection);
}
createControls();


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


var targetSelect = document.getElementById("target-select");
var targetSelectValue = targetSelect.value;
var projSelect = document.getElementById("projSelect");
var projSelectValue = projSelect.value;

var planetaryMap1 = new PlanetaryMap(String(targetSelectValue).toLowerCase(), 'cylindrical');
checkProjections(planetaryMap1.layers);


function switchTarget(target){
  planetaryMap1.destroy();
  planetaryMap1.target = target;
  planetaryMap1.createMap(planetaryMap1.parseWebAtlas());
  console.log(planetaryMap1.layers);
  checkProjections(planetaryMap1.layers);
}


targetSelect.onchange = function() {
  //document.getElementById("projSelect").options[0].selected = true;
  var target = String(targetSelect.options[targetSelect.selectedIndex].text).toLowerCase();
  document.getElementById("projSelect").options[0].selected = true;
  switchTarget(target);
}
