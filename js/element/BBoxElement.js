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

        if (maskUrl) {
            // Override the bounding box style when a mask is available.
            this.classList.add("masked");
            this.el.div.style.maskImage = `url("${maskUrl}")`;

            const image = new Image();
            image.onload = () => {
                this.canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
                let context = this.canvas.getContext("2d");
                context.drawImage(image, 0, 0);
            }
            image.src = maskUrl;

        }
    }

    isPointInsideMask(clientX, clientY) {
        let rect = this.getBoundingClientRect();
        if (this.canvas) {
            // Test the mask pixel data.
            let scaleX = this.canvas.width / rect.width,
                scaleY = this.canvas.height / rect.height,
                testX = (clientX - rect.x) * scaleX,
                testY = (clientY - rect.y) * scaleY;

            let context = this.canvas.getContext("2d");
            let pixel = context.getImageData(testX, testY, 1, 1);

            return pixel.data[0] > 0;
        } else {
            // Check if the mouse is inside the bounding rectangle.
            return clientX > rect.left 
                && clientX < rect.right 
                && clientY > rect.top
                && clientY < rect.bottom;
        }
    }

    setLabel(value) {
        // Set the index corresponding to the keys that cycle the label.
        this.el.label.innerText = `${String(this.segn + 1)}: ${value}`
    }

}

customElements.define('liebs-picker-bbox', BBoxElement);