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
var plantaryMap = new PlanetaryMap('mars', 'cylindrical');


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
  plantaryMap.switchProjection(newProjection);
}