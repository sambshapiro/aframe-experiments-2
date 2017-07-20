function addScrapedContent(title, description, src, link, imgPosition, titlePosition, descriptionPosition, rotation) {
  //src validation just to check if there's an image; if not, don't bother posting media card
  if (validateLink(src)<2) {
    var containerEl = document.createElement('a-entity');

    //generate image
    var imageEl = document.createElement('a-image');
    imageEl.setAttribute('visible','true');
    imageEl.setAttribute('position',imgPosition);
    imageEl.setAttribute('rotation',rotation);
    imageEl.setAttribute('material', 'src', 'url(' + src + ')');
    imageEl.setAttribute('link', 'link', link);

    //generate title
    var titleEl = document.createElement('a-text');
    titleEl.setAttribute('position',titlePosition);
    titleEl.setAttribute('rotation',rotation);
    titleEl.setAttribute('width',2);
    titleEl.setAttribute('align','center');
    titleEl.setAttribute('value',title);
    titleEl.setAttribute('side','double');
    titleEl.setAttribute('color','white');

    //generate description
    var descriptionEl = document.createElement('a-text');
    descriptionEl.setAttribute('position',descriptionPosition);
    descriptionEl.setAttribute('rotation',rotation);
    descriptionEl.setAttribute('width',2);
    descriptionEl.setAttribute('align','center');
    descriptionEl.setAttribute('value',description);
    descriptionEl.setAttribute('side','double');
    descriptionEl.setAttribute('color','white');


    containerEl.appendChild(imageEl);
    containerEl.appendChild(titleEl);
    containerEl.appendChild(descriptionEl);
    document.querySelector('a-scene').appendChild(containerEl);

  }
};
