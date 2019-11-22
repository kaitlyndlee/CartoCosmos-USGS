# CartoCosmos
Planetary Javascript mapping tools

## How to Use
First Download the Project. Extract the files from the .zip file and open the folder and then naviagate to the folder named "App". Next open index.html with your favorite internet browser(Firefox, Chrome, etc). 

![Map Example](images/examples/map_example.png?raw=true "Map Example")

This is the page you should see if everything went well. 

### Layer Selector
In the top map of the map, you should see the layer selector tool (light blue diamond icon).

![Layer Selector Example](images/examples/layer_selector_example.png?raw=true "Layer Selector Example")

If you hover over this icon, you will see all available layers. The Basemaps section allows you to change the basemap, or background image, of the map. The overlays section allows you to add features to the map, like gridlines or footprints.

### Map Options
In the bottom left of the map, you should see a menu called Map Options. 

![Menu Options Example](images/examples/map_menu_example.png?raw=true "Layer Selector Example")

This menu displays the current lattitude and longitude at your current mouse position. Note: If you dont see any value displaying, make sure your mouse is on top of the map. This map also has 3 small circular buttons that change the projection to North-polar, South-polar and Cylindrical. To the right of the buttons are 3 drop down menus. The first drop down menu, affects whether East or West is Positive. The next changes the domain from 0->360 to -180->180. The final drop down menu changes the coordinate system from Planetocentric to Planetographic and vice versa. 

### Draw Options
In the bottom left of the map, you should see a menu called Draw Options. 

![Menu Options Example](images/examples/draw_menu_example.png?raw=true "Layer Selector Example")

This menu allows you to draw footprints onto the map as either a box or a polygon. The drop down menu allows you to choose which draw style you would like to use. The Button labeled "Draw Shape" will enable drawing on the map. Finally the "Remove Shape" button deletes the current drawing on the map. The large text area at the bottom of the menu displays the WKT (Well Known Text) form of the polygon or box that is drawn onto the map. The values can be edited on the fly in this area.
