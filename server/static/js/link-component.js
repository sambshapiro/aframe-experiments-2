AFRAME.registerComponent('link', {
  schema: {
    link: {default: ""},
    movedAway: {default: true}
  },
  tick: function (time, timeDelta) {
    if (this.data.link != "")  {
      var playerPos = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
      if (
        playerPos.x < (this.el.getAttribute('position').x + .5) &&
        playerPos.x > (this.el.getAttribute('position').x - .5) &&
        playerPos.z < (this.el.getAttribute('position').z + .5) &&
        playerPos.z > (this.el.getAttribute('position').z - .5) &&
        this.data.movedAway
      ) {
        console.log("PASSED THROUGH IMAGE");
        console.log(this.data.link);
        window.open(this.data.link);
        this.data.movedAway = false;
      }
      if (!this.data.movedAway) {
        if (
          playerPos.x > (this.el.getAttribute('position').x + 2) ||
          playerPos.x < (this.el.getAttribute('position').x - 2) ||
          playerPos.z > (this.el.getAttribute('position').z + 2) ||
          playerPos.z < (this.el.getAttribute('position').z - 2)
        )
        {
          console.log("MOVED AWAY FROM IMAGE");
          this.data.movedAway = true;
        }
      }
    }
  }
});
