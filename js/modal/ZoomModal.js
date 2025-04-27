import { BaseModal } from "./BaseModal.js";

export const MODAL_HTML = `
    <header>
        <h1>Image Picker</h1>
        <span>? of ?</span>
        <div>
            <div class="p-component">
                <button class="p-button p-button-secondary cancel-button">
                    <span class="p-button-label">Cancel</span>
                </button>
                <button class="p-button p-button-secondary back-button">
                    <span class="p-button-label">Back</span>
                </button>
                <button class="p-button p-button-primary send-button">
                    <span class="p-button-label">Send</span>
                </button>
                
            </div>
            <div class="p-component">
                <button class="p-button p-button-secondary first-button">
                    <span class="p-button-icon pi pi-step-backward"></span>
                </button>
                <button class="p-button p-button-secondary prev-button">
                    <span class="p-button-icon pi pi-play"></span>
                </button>
                <button class="p-button p-button-secondary next-button">
                    <span class="p-button-icon pi pi-play"></span>
                </button>
                <button class="p-button p-button-secondary last-button">
                    <span class="p-button-icon pi pi-step-forward"></span>
                </button>
            </div>
        </div>
    </header>
    <content>
        <liebs-picker-image></liebs-picker-image>
    </content>
`;

/**
 * Displays one image at a time using all available space.
 */
export class ZoomModal extends BaseModal {

    constructor(options) {
        super();

        this.attached = false;

        // Construct the modal from HTML.
        this.innerHTML = MODAL_HTML;
        this.el = {
            title: this.querySelector('header h1'),
            subtitle: this.querySelector('header span'),
            cancelButton: this.querySelector('.cancel-button'),            
            sendButton: this.querySelector('.send-button'),
            backButton: this.querySelector('.back-button'),
            firstButton: this.querySelector('.first-button'),            
            prevButton: this.querySelector('.prev-button'),
            nextButton: this.querySelector('.next-button'),            
            lastButton: this.querySelector('.last-button'),  
            content: this.querySelector('content'),
            image: this.querySelector('liebs-picker-image')
        };

        // Create event handlers for this modal.
        this.handlerMouseWheel = this.onMouseWheel.bind(this);
        this.addEventListener('mousewheel', this.handlerMouseWheel);        

        this.handlerCancel = this.onCancel.bind(this);
        this.el.cancelButton.addEventListener('click', this.handlerCancel);
        this.handlerSend = this.onSend.bind(this);
        this.el.sendButton.addEventListener('click', this.handlerSend);        
        this.handlerBack = this.onBack.bind(this);
        this.el.backButton.addEventListener('click', this.handlerBack);

        this.handlerFirst = this.onFirst.bind(this);
        this.el.firstButton.addEventListener('click', this.handlerFirst);
        this.handlerPrev = this.onPrevious.bind(this);
        this.el.prevButton.addEventListener('click', this.handlerPrev);
        this.handlerNext = this.onNext.bind(this);
        this.el.nextButton.addEventListener('click', this.handlerNext);
        this.handlerLast = this.onLast.bind(this);
        this.el.lastButton.addEventListener('click', this.handlerLast);

        this.handlerImageIndex = this.onImageIndex.bind(this);
        this.el.image.addEventListener('image-index', this.handlerImageIndex);
        this.handlerImageClick = this.onImageClick.bind(this);
        this.el.image.addEventListener('image-click', this.handlerImageClick);
        this.handlerImageMousedown = this.onImageMousedown.bind(this);
        this.el.image.addEventListener('image-mousedown', this.handlerImageMousedown);        

        // Initialize the modal controls.
        this.setImageList(options.imageList, options.index);
        this.setTitle(options.title);
        this.setSubtitle();
        this.updateSendButton();
    }

    // Prepare a grid style layout.
    async layout() {
        if (!this.attached) {
            // Modal is not attached to the DOM.
            return;
        }

        const imageList = this.el.image.imageList;
        if (!imageList && !imageList.length) {
            // No image to display.
            return;
        }

        const [imageWidth, imageHeight] = await this.el.image.getImageSize(), 
            box = this.el.content.getBoundingClientRect(),
            widthRatio = box.width / imageWidth, 
            heightRatio = box.height / imageHeight, 
            scale = widthRatio < heightRatio ? widthRatio : heightRatio, 
            scaledWidth = imageWidth * scale, 
            scaledHeight = imageHeight * scale; 
        
        this.el.image.style.maxHeight = `${scaledHeight}px`;
        this.el.image.style.maxWidth = `${scaledWidth}px`;

        // Can show the modal content now.
        this.classList.remove('first-layout');
    }

    // Handle keydown in the modal.
    onKeyDown(event) {
        let handled = false;

        const letterKey = event.key.toUpperCase();

        // Back to grid view with spacebar.
        if (event.key === ' ') {
            handled = true;
            this.onBack();
        } else
        // Cancel the modal with Escape.
        if (event.key === 'Escape') {
            handled = true;
            this.onCancel();
        } else 
        // Submit the modal with Enter.
        if ((event.key === 'Enter') && !this.el.sendButton.disabled) {
            handled = true;
            this.onSend();
        } else
        // Move back and forward with arrow keys or A and D.
        if (event.key === 'ArrowLeft' || letterKey === 'A') {
            handled = true;
            this.onPrevious();
        } else
        if (event.key === 'ArrowRight' || letterKey === 'D') {
            handled = true;
            this.onNext();
        } else 
        if (event.key === 'Home') {
            handled = true;
            thia.onFirst();
        } else 
        if (event.key === 'End') {
            handled = true;
            thia.onLast();
        }
        // Select an image with E or /.
        if (letterKey === 'E' || letterKey === '/') {
            handled = true;

            const imageList = this.el.image.imageList,
                index = this.el.image.index;

            imageList.toggleSelect(index);
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // Handle wheel events in the model.
    onMouseWheel(event) {
        if (event.deltaY < 0) {
            this.el.nextButton.click();
        } else
        if (event.deltaY > 0) {
            this.el.prevButton.click();
        }
    }

    // Set the modal title.
    setTitle(value) {
        this.el.title.innerText = value ?? 'Image Picker';
    }

    // Set the modal subtitle.
    setSubtitle(value) {
        this.el.subtitle.innerText = value ?? 
            `${this.el.image.index + 1} of ${this.el.image.imageList.length}`;
    }

    // Update the label on the Send button.
    updateSendButton(label) {
        const selectedCount = this.el.image.imageList.selectedCount;

        this.el.sendButton.innerText = label ?? 
            `Send (${selectedCount})`;

        this.el.sendButton.disabled = selectedCount < 1;
    }  

    // Set the list of images to display.
    setImageList(value, index = 0) {        
        this.el.image.setImageList(value, index);                
    }

    setIndex(value) {
        this.el.image.setIndex(value);
    }
    // Invoked when the image index in the image list is changed.
    onImageIndex(event) {
        const detail = event.detail, 
            lastIndex = detail.imageList.length - 1;
        
        // Disable next and previous button when at the ends of the list.
        this.el.nextButton.disabled = detail.index >= lastIndex;
        this.el.prevButton.disabled = detail.index <= 0;
    }

    // Invoked when an image is clicked.
    onImageClick(event) {
        const detail = event.detail;        
        this.el.image.imageList.toggleSelect(detail.index);
        this.updateSendButton();
    }

    // Invoked when mousedown on an image.
    onImageMousedown(event) {
        const detail = event.detail;
        if (detail.button === 1) {            
            this.onBack();
        }
    }

    onFirst() {
        this.el.image.setIndex(0);
        this.setSubtitle();
    }

    onPrevious() {
        const index = this.el.image.index;

        if (index > 0) {
            this.el.image.setIndex(index - 1);
            this.setSubtitle();
        }
    }

    onNext() {
        const index = this.el.image.index,
            imageList = this.el.image.imageList,
            lastIndex = imageList.length - 1;

        if (index < lastIndex) {
            this.el.image.setIndex(index + 1);
            this.setSubtitle();
        }
    }

    onLast() {
        const index = this.el.image.index,
            imageList = this.el.image.imageList,
            lastIndex = imageList.length - 1;

        this.el.image.setIndex(lastIndex);
        this.setSubtitle();
    }

    onSend() {
        this.detach();
        this.resolve('send');
    }

    onBack() {
        this.detach();
        this.resolve('back');
    }

    onCancel() {
        this.detach();
        this.resolve('cancel');
    }

}

customElements.define('liebs-picker-zoom-modal', ZoomModal);
