const ELEMENT_HTML = `
    <span class="label"></span>
`;

/**
 * Element for an instance of a bounding box in an overlay.
 */
export class BBoxElement extends HTMLElement {

    constructor(segn, size, bbox) {
        super();

        this.segn = segn;

        this.innerHTML = ELEMENT_HTML;
        this.el = {
            label: this.querySelector('.label')
        };

        const [ height, width ] = size,
              left = bbox[0],
              top = bbox[1],
              right = bbox[2],
              bottom = bbox[3];

        this.style.left = `${(left / width) * 100}%`;
        this.style.top = `${(top / height) * 100}%`;
        this.style.width = `${((right - left) / width) * 100}%`;
        this.style.height = `${((bottom - top) / height) * 100}%`;

        // Send clicks to the overlay element.
        this.addEventListener('click', event => {
            this.dispatchEvent(new CustomEvent('bbox-click', {
                detail: {
                    element: this,
                    segn
                }
            }))

            event.preventDefault();
            event.stopPropagation();
        });
    }

    setLabel(value) {
        // Set the index corresponding to the keys that cycle the label.
        this.el.label.innerText = `${String(this.segn + 1)}: ${value}`
    }

}

customElements.define('liebs-picker-bbox', BBoxElement);