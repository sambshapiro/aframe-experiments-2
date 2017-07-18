AFRAME.registerComponent('url', {
  schema: {
    url: {default: ""},
    movedAway: {default: true}
  },
  tick: function (time, timeDelta) {
    var playerPos = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
    if (
      playerPos.x < (this.el.getAttribute('position').x + .5) &&
      playerPos.x > (this.el.getAttribute('position').x - .5) &&
      playerPos.z < (this.el.getAttribute('position').z + .5) &&
      playerPos.z > (this.el.getAttribute('position').z - .5) &&
      this.el.getAttribute('url').movedAway
    ) {
      console.log("PASSED THROUGH IMAGE");
      window.open(this.el.getAttribute('url').url);
      this.el.setAttribute('url', 'movedAway', 'false');
      console.log("moved away: " + this.el.getAttribute('url').movedAway);
    }
    if (!this.el.getAttribute('url').movedAway) {
      if (
        playerPos.x > (this.el.getAttribute('position').x + 2) ||
        playerPos.x < (this.el.getAttribute('position').x - 2) ||
        playerPos.z > (this.el.getAttribute('position').z + 2) ||
        playerPos.z < (this.el.getAttribute('position').z - 2)
      )
      {
        console.log("MOVED AWAY FROM IMAGE");
        this.el.setAttribute('url', 'movedAway', 'true');
      }
    }
  }
});
