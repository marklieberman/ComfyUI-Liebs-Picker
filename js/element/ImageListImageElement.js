import { BBoxOverlayElement } from "./BBoxOverlayElement.js";

const ELEMENT_HTML = `
    <img>
    <div class="overlay"></div>
    <div class="actions">
        <button class="select" title="Toggle Select">
            <span class="p-button-icon pi pi-check"></span>
        </button>
        <button class="unwanted" title="Toggle Unwanted">
            <span class="p-button-icon pi pi-ban"></span>
        </button>
    </div>
`;

const ATTRIB_DATA_SELECT = 'data-selected';
const ATTRIB_DATA_UNWANTED = 'data-unwanted';

/**
 * Element that displays an image from an ImageList.
 */
export class ImageListImageElement extends HTMLElement {

    constructor() {
        super();

        this.index = null;

        // Construct the element from HTML.
        this.innerHTML = ELEMENT_HTML;
        this.el = {
            image: this.querySelector('img'),
            selectButton: this.querySelector('.select'),
            unwantedButton: this.querySelector('.unwanted'),
            segmentsOverlay: null
        };

        // Create event handlers for this instance.
        this.handlerClick = this.onClick.bind(this);
        this.addEventListener('click', this.handlerClick);
        this.handlerMousedown = this.onMousedown.bind(this);
        this.addEventListener('mousedown', this.handlerMousedown);        
        this.handlerImageAttributeChanged = this.onImageAttributeChanged.bind(this);
        
        // Bind action button click handlers.
        this.handlerActionSelect = this.onActionClick.bind(this, 'select');
        this.el.selectButton.addEventListener('click', this.handlerActionSelect);
        this.handlerActionUnwanted = this.onActionClick.bind(this, 'unwanted');        
        this.el.unwantedButton.addEventListener('click', this.handlerActionUnwanted);
    }

    // Set the image list from which the image will be displayed.
    setImageList(value, index = 0) {
        this.imageList = value;       
        this.imageList.addEventListener('image-select', this.handlerImageAttributeChanged);
        this.imageList.addEventListener('image-unwanted', this.handlerImageAttributeChanged);
        this.setIndex(index);
    }

    // Set the index of the image in the image list to display.
    setIndex(value) {      
        if (this.index !== value)  {
            this.index = value;
            this.el.image.src = this.imageList.getImageUrl(value);
            
            this.updateAttributes();

            // Add a segments overlay if the iamge has segment data.
            const segments = this.imageList.getImageSegments(value);
            if (segments) {
                if (!this.el.segmentsOverlay) {
                    this.el.segmentsOverlay = new BBoxOverlayElement();
                    this.appendChild(this.el.segmentsOverlay);
                }
                this.el.segmentsOverlay.setSegments(segments);
            } else {
                // Image data does have segments.
                this.removeChild(this.el.segmentsOverlay);
                this.el.segmentsOverlay = null;
            }
           
            this.dispatchEvent(new CustomEvent('image-index', {
                detail: {
                    imageList: this.imageList,
                    index: this.index
                }
            }));
        }
    }

    // Update the attributes that decorate the image.
    updateAttributes() {
        const selected = this.imageList.isSelected(this.index),
            unwanted = this.imageList.isUnwanted(this.index);

        this.setAttribute(ATTRIB_DATA_SELECT, selected ? 'yes' : 'no');
        this.setAttribute(ATTRIB_DATA_UNWANTED, unwanted ? 'yes' : 'no');
    }

    // Invoked when mousedown on the image.
    onMousedown(event) {
        this.dispatchEvent(new CustomEvent('image-mousedown', {
            detail: {
                button: event.button,
                imageList: this.imageList,
                index: this.index
            }
        }));
    }

    // Invoked when the image is clicked.
    onClick() {        
        this.dispatchEvent(new CustomEvent('image-click', {
            detail: {
                imageList: this.imageList,
                index: this.index
            }
        }));
    }

    // Invoked when a action button is clicked.
    onActionClick(action, event) {
        event.preventDefault();
        event.stopPropagation();        
        this.dispatchEvent(new CustomEvent(`image-action`, {
            detail: {
                action,
                imageList: this.imageList,
                index: this.index
            }
        }));
    }

    // Invoked when the selection in the image list changes.
    onImageAttributeChanged(event) {
        const detail = event.detail;
        if (detail.index === this.index) {
            this.updateAttributes();
        }
    }

    // Return a promise that is resoved with the width and height of an image.
    async getImageSize() {
        const self = this;
        return new Promise((resolve, reject) => {
            function check(n) {
                if (self.el.image.naturalWidth) {
                    resolve([
                        self.el.image.naturalWidth,
                        self.el.image.naturalHeight
                    ]);
                }
                else if (n > 100) {
                    reject();
                } else {
                    setTimeout(check.bind(null, n + 1), 100);
                }
            }
            check(1);
        });
    }
}

customElements.define('liebs-picker-image', ImageListImageElement);
