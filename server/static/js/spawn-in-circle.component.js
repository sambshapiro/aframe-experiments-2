AFRAME.registerComponent('spawn-in-circle', {
  schema: {
    radius: {type: 'number', default: 1}
  },

  init: function() {
    var el = this.el;
    var center = el.getAttribute('position');

    var angleRad = this.getRandomAngleInRadians();
    var circlePoint = this.randomPointOnCircle(this.data.radius, angleRad);
    var worldPoint = {x: circlePoint.x + center.x, y: center.y, z: circlePoint.y + center.z};
    el.setAttribute('position', worldPoint);

    var angleDeg = angleRad * 180 / Math.PI;
    var angleToCenter = -1 * angleDeg + 90;
    var rotationStr = '0 ' + angleToCenter + ' 0';
    el.setAttribute('rotation', rotationStr);
    console.log("my rotation is [" + el.getAttribute('rotation').x + ", " + el.getAttribute('rotation').y + ", " + el.getAttribute('rotation').z + "]");

    if (typeof specLocX !== 'undefined') {
      console.log("moving to saved position");
      var movePos = new THREE.Vector3(specLocX, specLocY, specLocZ);
      var moveRot = new THREE.Vector3(specRotX, specRotY, specRotZ);
      document.querySelector('a-scene').querySelector('#player').setAttribute('position',movePos);
      document.querySelector('a-scene').querySelector('#player').setAttribute('rotation',moveRot);
    }
  },

  getRandomAngleInRadians: function() {
    return Math.random()*Math.PI*2;
  },

  randomPointOnCircle: function (radius, angleRad) {
    var x = Math.cos(angleRad)*radius;
    var y = Math.sin(angleRad)*radius;
    return {x: x, y: y};
  }
});
