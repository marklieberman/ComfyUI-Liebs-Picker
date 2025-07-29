import { BaseModal } from "./BaseModal.js";

export const MODAL_HTML = `
    <header>
        <h1>Image Picker</h1>
        <span>? of ?</span>
        <div class="spacer"></div>
        <div class="p-component toggle-switch segs-control segs-switch">
            SEGS
            <label class="switch">
                <input type="checkbox">
                <span class="slider"></span>                
            </label>            
        </div>
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
    </header>
    <content class="hide-segments">
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
            segsCheckbox: this.querySelector('.segs-switch input'),
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
        this.addEventListener('wheel', this.handlerMouseWheel);        

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

        this.handlerImageListSelect = this.onImageListSelectOrUnwanted.bind(this);        
        this.handlerImageListUnwanted = this.onImageListSelectOrUnwanted.bind(this);

        this.handlerImageIndex = this.onImageIndex.bind(this);
        this.el.image.addEventListener('image-index', this.handlerImageIndex);
        this.handlerImageClick = this.onImageClick.bind(this);
        this.el.image.addEventListener('image-click', this.handlerImageClick);
        this.handlerImageAction = this.onImageAction.bind(this);
        this.el.image.addEventListener('image-action', this.handlerImageAction);
        this.handlerImageMousedown = this.onImageMousedown.bind(this);
        this.el.image.addEventListener('image-mousedown', this.handlerImageMousedown);    
        
        this.el.segsCheckbox.addEventListener('click', () => {
            this.displaySegments(this.el.segsCheckbox.checked);
        });

        // Initialize the modal controls.
        this.pickerMode = options.pickerMode ?? 'picker';
        this.pickerModeMustPick = options.pickerModeMustPick ?? false;
        this.setImageList(options.imageList, options.index);
        this.setTitle(options.title);
        this.setSubtitle();        
        this.updateSendButton();

        // Display SEGS controls when features are enabled.
        this.segsControls = options.segsControls ?? false;
        if (this.segsControls) {
            this.classList.add("segs-controls");
            this.displaySegments(options.showSegments ?? true);
        } else {
            this.displaySegments(false);
        }
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

        let n = parseInt(event.key);
        if (Number.isInteger(n)) {
            n = (n === 0) ? 9 : n - 1;
            if (this.segsControls && event.altKey && this.isSegmentsVisible()) {
                // Cycle segment labels of the Nth segment of the focused image when alt-key is pressed.
                const index = this.el.image.index;
                this.el.image.imageList.getImageSegments(index)?.nextLabel(n);
            }
        } else         
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
            this.onFirst();
        } else 
        if (event.key === 'End') {
            handled = true;
            this.onLast();
        } else
        // Select an image with E or /.
        if (letterKey === 'E' || letterKey === '/') {
            handled = true;
            const imageList = this.el.image.imageList,
                index = this.el.image.index;
            switch (this.pickerMode) {
                case 'picker':
                    imageList.unwanted(index, false);
                    imageList.toggleSelect(index);
                    break;
                case 'filter':
                    imageList.select(index, false);
                    imageList.toggleUnwanted(index);
                    break;
            }
        } else
        // Unwant an image with X.
        if (letterKey === 'X' || letterKey === '\'') {
            handled = true;
            const imageList = this.el.image.imageList,
                index = this.el.image.index;                
            switch (this.pickerMode) {
                case 'picker':
                    imageList.select(index, false);
                    imageList.toggleUnwanted(index);                    
                    break;
                case 'filter':
                    imageList.unwanted(index, false);
                    imageList.toggleSelect(index);
                    break;
            }
        } else 
        // Toggle visibility of the segments overlay.
        if (this.segsControls && (event.key === '`') && event.altKey) {
            this.displaySegments(!this.isSegmentsVisible());
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
    updateSendButton() {
        const selectedCount = this.el.image.imageList.selectedCount,
            wantedCount = this.el.image.imageList.wantedCount,
            mustPick = (this.pickerMode === 'picker') && this.pickerModeMustPick;

        if ((selectedCount > 0) || mustPick) {
            this.el.sendButton.innerText = `Send (${selectedCount} selected)`;
            this.el.sendButton.disabled = selectedCount < 1;
        } else {
            this.el.sendButton.innerText = `Send (${wantedCount} remaining)`;
            this.el.sendButton.disabled = wantedCount < 1;
        }
    }  

    // Set the list of images to display.
    setImageList(value, index = 0) {        
        this.el.image.setImageList(value, index);                
        value.addEventListener('image-select', this.handlerImageListSelect);
        value.addEventListener('image-unwanted', this.handlerImageListUnwanted);
    }

    // Set the index of the image to display from the image list.
    setIndex(value) {
        this.el.image.setIndex(value);
    }

    // True if segments overlay is visible, otherwise false.
    isSegmentsVisible() {
        return !this.el.content.classList.contains('hide-segments');
    }

    // Set visibility of the segments overlay.
    displaySegments(value) {
        this.showSegments = value;
        this.el.segsCheckbox.checked = value;
        if (value) {
            this.el.content.classList.remove('hide-segments');
        } else {
            this.el.content.classList.add('hide-segments');
        }
    }    

    // Invoked when the image index in the image list is changed.
    onImageIndex(event) {
        const detail = event.detail, 
            lastIndex = detail.imageList.length - 1;
        
        // Disable next and previous button when at the ends of the list.
        this.el.nextButton.disabled = detail.index >= lastIndex;
        this.el.prevButton.disabled = detail.index <= 0;
    }

    // Invoked when the selection or unwanted flag in the image list changes.
    onImageListSelectOrUnwanted() {
        this.updateSendButton();
    }

    // Invoked when an image is clicked.
    onImageClick(event) {
        const detail = event.detail,
            imageList = this.el.image.imageList;

        switch (this.pickerMode) {
            case 'picker':
                imageList.unwanted(detail.index, false);
                imageList.toggleSelect(detail.index);
                break;
            case 'filter':
                imageList.select(detail.index, false);
                imageList.toggleUnwanted(detail.index);
                break;
        }        
    }

    // Invoked when an action button is clicked on an image.
    onImageAction(event) {
        const detail = event.detail,
            imageList = this.el.image.imageList;

        switch (detail.action) {
            case 'select':
                imageList.toggleSelect(detail.index);
                imageList.unwanted(detail.index, false);
                break;
            case 'unwanted':
                imageList.select(detail.index, false);
                imageList.toggleUnwanted(detail.index);
                break;            
        }
    }

    // Invoked when mousedown on an image.
    onImageMousedown(event) {
        const detail = event.detail;
        if (detail.button === 1) {            
            this.onBack();
        }
    }

    // Invoked when the First button is clicked.
    onFirst() {
        this.el.image.setIndex(0);
        this.setSubtitle();
    }

    // Invoked when the Previous button is clicked.
    onPrevious() {
        const index = this.el.image.index;

        if (index > 0) {
            this.el.image.setIndex(index - 1);
            this.setSubtitle();
        }
    }

    // Invoked when the Next button is clicked.
    onNext() {
        const index = this.el.image.index,
            imageList = this.el.image.imageList,
            lastIndex = imageList.length - 1;

        if (index < lastIndex) {
            this.el.image.setIndex(index + 1);
            this.setSubtitle();
        }
    }

    // Invoked when the Last button is clicked.
    onLast() {
        const imageList = this.el.image.imageList,
            lastIndex = imageList.length - 1;

        this.el.image.setIndex(lastIndex);
        this.setSubtitle();
    }

    // Invoked when the Send button is clicked.
    onSend() {
        this.detach();
        this.resolve('send');
    }

    // Invoked when the Back button is clicked.
    onBack() {
        this.detach();
        this.resolve('back');
    }

    // Invoked when the Cancel button is clicked.
    onCancel() {
        this.detach();
        this.resolve('cancel');
    }

}

customElements.define('liebs-picker-zoom-modal', ZoomModal);
