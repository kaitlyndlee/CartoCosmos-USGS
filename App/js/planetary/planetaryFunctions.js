/*
 * This File Contains all planetary related functions
 */

// Test Function
function testFunc(){
   console.log("Test Function succesful");
}

projectionDefs = {  
  "targets":[
    {
      "name": "mars",
      "projections": [
        {
          "name": "north-polar stereographic",
          "code": "EPSG:32661",
          "string": "+proj=stere +lat_0=90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=3396190 +b=3396190 +units=m +no_defs"
        }
      ] 
    }
  ]
}