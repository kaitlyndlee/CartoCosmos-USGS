// TODO Change this?
function parseWebAtlas() {
  var targets = [];

  var json = myJSONmaps['targets'];
  for(var i = 0; i < json.length; i++) {
    var currentTarget = json[i];

    if(!targets.includes(String(currentTarget))){
      targets.push(String(currentTarget));
    }
    targets.sort();
  }
}
parseWebAtlas();

var targetSelect = document.getElementById("target-select").value;

var planetaryMap = new PlanetaryMap('mars', 'cylindrical');
//planetaryMap.switchTarget("saturn");
