/*
var RotateNorthControl = (function(Control){
  function RotateNorthControl(opt_options) {
    var options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = 'N';

    var element = document.createElement('div');
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(button);

    Control.call(this, {
      element: element,
      target: options.target
    });

    button.addEventListener('click', this.handleRotateNorth.bind(this), false);
  }

  if(Control)RotateNorthControl.__proto__ = Control;
  RotateNorthControl.prototype = Object.create( Control && Control.prototype );
  RotateNorthControl.prototype.constructor = RotateNorthControl;

  RotateNorthControl.prototype.handleRotateNorth = function handleRotateNorth () {
    this.getMap().getView().setRotation(0);
  };

  return RotateNorthControl;
}(ol.control.Control));
*/
