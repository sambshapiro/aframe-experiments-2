function getPlacementPosition() {
  var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
  var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');

  var siny = Math.sin(currentRotation.y * Math.PI / 180.0);
  var cosy = Math.cos(currentRotation.y * Math.PI / 180.0);
  var sinx = Math.sin(currentRotation.x * Math.PI / 180.0);

  var position = new THREE.Vector3(currentPosition.x - siny, currentPosition.y + sinx, currentPosition.z - cosy);
  var rotation = currentRotation;

  coords = {position, rotation};

  return coords;
}

function addImageToScene(src, position, rotation, link, gif) {
  var containerEl = document.createElement('a-entity');
  var entityEl = document.createElement('a-image');
  containerEl.appendChild(entityEl);
  document.querySelector('a-scene').appendChild(containerEl);
  entityEl.setAttribute('visible','true');
  entityEl.setAttribute('position',position);
  entityEl.setAttribute('rotation',rotation);
  entityEl.setAttribute('material', 'src', 'url(' + src + ')');
  entityEl.setAttribute('material', 'alphaTest', .001);
  entityEl.setAttribute('material', 'transparent', true);
  entityEl.setAttribute('fit-texture','');
  entityEl.setAttribute('mylink', 'link', link);
  if (gif) {
    entityEl.setAttribute('material', 'shader', 'gif');
  }
}

function addScrapedContent(title, description, src, link, position, rotation) {
  //src validation just to check if there's an image; if not, don't bother posting media card
  if (validateLink(src)<2) {
    var containerEl = document.createElement('a-entity');
    containerEl.setAttribute('position', position);
    containerEl.setAttribute('rotation', rotation);
    containerEl.setAttribute('geometry', 'primitive', 'plane');
    containerEl.setAttribute('geometry', 'width', 1.2);
    containerEl.setAttribute('geometry', 'height', 1.7);
    containerEl.setAttribute('material', 'color', 'white');
    containerEl.setAttribute('material', 'side', 'double');
    containerEl.setAttribute('mylink', 'link', link);

    //generate image
    var imageEl = document.createElement('a-image');
    imageEl.setAttribute('position','0 0 .005');
    imageEl.setAttribute('rotation','0 0 0');
    imageEl.setAttribute('fit-texture','');
    imageEl.setAttribute('width', 1.2);
    imageEl.setAttribute('material', 'src', 'url(' + src + ')');
    //imageEl.setAttribute('material', 'alphaTest', .001);
    //imageEl.setAttribute('material', 'transparent', true);

    //generate title
    var titleEl = document.createElement('a-text');
    titleEl.setAttribute('position','0 .6 0');
    titleEl.setAttribute('rotation','0 0 0');
    titleEl.setAttribute('align','center');
    titleEl.setAttribute('value',title);
    titleEl.setAttribute('color','black');

    //generate description
    var descriptionEl = document.createElement('a-text');
    descriptionEl.setAttribute('position','-0.540 -0.560 0');
    descriptionEl.setAttribute('rotation','0 0 0');
    descriptionEl.setAttribute('width',1.150);
    descriptionEl.setAttribute('wrapCount',26.800);
    descriptionEl.setAttribute('align','left');
    descriptionEl.setAttribute('value',description);
    descriptionEl.setAttribute('color','black');

    containerEl.appendChild(imageEl);
    containerEl.appendChild(titleEl);
    containerEl.appendChild(descriptionEl);
    document.querySelector('a-scene').appendChild(containerEl);

  }
};

function addMessageToScene(message, position, rotation) {

  var containerEl = document.createElement('a-entity');
  containerEl.setAttribute('position', position);
  containerEl.setAttribute('rotation', rotation);
  containerEl.setAttribute('geometry', 'primitive', 'plane');
  containerEl.setAttribute('geometry', 'width', 'auto');
  containerEl.setAttribute('geometry', 'height', 'auto');
  containerEl.setAttribute('material', 'color', 'white');
  containerEl.setAttribute('material', 'side', 'double');
  containerEl.setAttribute('text', 'align', 'center');
  containerEl.setAttribute('text', 'value', message);
  containerEl.setAttribute('text', 'color', 'black');
  containerEl.setAttribute('text', 'side', 'double');

  document.querySelector('a-scene').appendChild(containerEl);

}
