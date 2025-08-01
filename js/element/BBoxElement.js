const ELEMENT_HTML = `
    <div></div>
    <span class="label"></span>
`;

/**
 * Element for an instance of a bounding box in an overlay.
 */
export class BBoxElement extends HTMLElement {

    constructor(segn, size, bbox, maskUrl) {
        super();

        this.segn = segn;
        
        this.innerHTML = ELEMENT_HTML;
        this.el = {
            div: this.querySelector('div'),
            label: this.querySelector('.label')
        };

        const [ imageHeight, imageWidth ] = size,
              left = bbox[0],
              top = bbox[1],
              right = bbox[2],
              bottom = bbox[3],
              height = bottom - top,
              width = right - left;

        this.style.left = `${(left / imageWidth) * 100}%`;
        this.style.top = `${(top / imageHeight) * 100}%`;
        this.style.width = `${(width / imageWidth) * 100}%`;
        this.style.height = `${(height / imageHeight) * 100}%`;

        // Ensure that smaller boxes are placed on top of larger boxes.
        this.style.zIndex = Math.round(2147483647 - (height * width));

        // Send clicks to the overlay element.
        this.addEventListener('mousedown', event => {
            this.dispatchEvent(new CustomEvent('bbox-mousedown', {
                detail: {
                    button: event.button,
                    element: this,
                    segn
                }
            }))

            event.preventDefault();
            event.stopPropagation();
        });

        // Prevent clicks from propagating.
        this.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
        });

        // Prevent the context menu from being display.
        this.addEventListener('contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
        });

        if (maskUrl) {
            // Override the bounding box style when a mask is available.
            this.classList.add("masked");
            this.el.div.style.maskImage = `url("${maskUrl}")`;
        }
    }

    setLabel(value) {
        // Set the index corresponding to the keys that cycle the label.
        this.el.label.innerText = `${String(this.segn + 1)}: ${value}`
    }

}

customElements.define('liebs-picker-bbox', BBoxElement);