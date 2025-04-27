import { BaseModal } from "./BaseModal.js";
import { ImageListImageElement } from "../ImageListImageElement.js";
import { ZoomModal } from "./ZoomModal.js";

const MODAL_HTML = `
    <header class="not-zoomed">
        <h1>Image Picker</h1>
        <div class="p-component">
            <button class="p-button p-button-secondary cancel-button">Cancel</button>
            <button class="p-button p-button-primary send-button">Send</button>
        </div>
    </header>
    <content>
        <div class="image-list"><div>
    <content>   
`;

/**
 * Displays the image list in a grid.
 */
export class GridModal extends BaseModal {

    constructor(options) {
        super();

        // Construct the modal from HTML.
        this.innerHTML = MODAL_HTML;
        this.el = {
            title: this.querySelector('header h1'),
            sendButton: this.querySelector('.send-button'),
            cancelButton: this.querySelector('.cancel-button'),
            content: this.querySelector('content'),
            imageList: this.querySelector('.image-list')
        };

        // Create event handlers for this modal.
        this.handlerSend = this.onSend.bind(this);
        this.el.sendButton.addEventListener('click', this.handlerSend);
        this.handlerCancel = this.onCancel.bind(this);
        this.el.cancelButton.addEventListener('click', this.handlerCancel);

        this.handlerImageClick = this.onImageClick.bind(this);
        this.handlerImageMouseDown = this.onImageMouseDown.bind(this);
        this.handlerImageSelect = this.onImageSelect.bind(this);
        this.handlerImageMouseEnter = this.onImageMouseEnter.bind(this);
        this.handlerImageMouseLeave = this.onImageMouseLeave.bind(this);
        this.handlerImageFocus = this.onImageFocus.bind(this);

        // Initialize the modal controls.
        this.mouseOverImage = null;        
        this.setTitle(options.title);
        this.setImageList(options.imageList);
        this.updateSendButton();
    }

    // Prepare a grid style layout.
    async layout() {
        if (!this.attached) {
            // Modal is not attached to the DOM.
            return;
        }

        const images = Array.from(this.el.imageList.children), 
            imageCount = images.length;

        if (!imageCount) {
            // No images to display.
            return;
        }

        const [imageWidth, imageHeight] = await images[0].getImageSize(), 
            grid = this.el.content.getBoundingClientRect();

        let lastImagesPerRow = 1, bestLayout = { scaledArea: 0 };
        for (let rows = 1; rows <= imageCount; rows++) {
            const imagesPerRow = Math.ceil(imageCount / rows);
            if (imagesPerRow === lastImagesPerRow) {
                // Already checked this layout.
                continue;
            } else {
                lastImagesPerRow = imagesPerRow;
            }

            // Determine the grid layout that maximizes the scaled image size.
            const cellWidth = grid.width / imagesPerRow, 
                cellHeight = grid.height / rows, 
                widthRatio = cellWidth / imageWidth, 
                heightRatio = cellHeight / imageHeight, 
                scale = widthRatio < heightRatio ? widthRatio : heightRatio;

            let layout = {
                rows,
                imagesPerRow,
                cellWidth,
                cellHeight,
                scale
            };

            if (bestLayout.scale > layout.scale) {
                // Previous layout was largest scaled image.
                break;
            } else {
                bestLayout = layout;
            }
        }

        for (let n = 0; n < images.length; n++) {
            const gridX = Math.floor(n / bestLayout.imagesPerRow) + 1, 
                gridY = n % bestLayout.imagesPerRow + 1;
            images[n].style.gridArea = `${gridX} / ${gridY} /  auto / auto`;
            images[n].style.maxHeight = `${bestLayout.cellHeight}px`;
            images[n].style.maxWidth = `${bestLayout.cellWidth}px`;
            images[n].setAttribute('data-grid-x', gridX);
            images[n].setAttribute('data-grid-y', gridY);
        }

        // Can show the modal content now.
        this.classList.remove('first-layout');
    }

    // Handle keydown in the modal.
    onKeyDown(event) {
        let handled = false;

        const letterKey = event.key.toUpperCase();

        // Select up to 10 images using numeric keys.
        let n = parseInt(event.key);
        if (Number.isInteger(n)) {
            n = (n === 0) ? 9 : n - 1;
            if (n < this.imageList.length) {
                handled = true;
                this.imageList.toggleSelect(n);
            }
        } else         
        // Cancel the modal with Escape.
        if ((event.key === 'Escape')) {
            handled = true;
            this.onCancel();
        } else 
        // Submit the modal with Enter.
        if ((event.key === 'Enter') && !this.el.sendButton.disabled) {
            handled = true;
            this.onSend();
        } else 
        //Move around the grid with arrow keys or W and S.
        if (event.key === 'ArrowUp' || letterKey === 'W') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.gridMoveFocus(-1, 0);
        } else
        if (event.key === 'ArrowDown' || letterKey === 'S') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.gridMoveFocus(1, 0);
        } else 
        if (event.key === 'ArrowLeft' || letterKey === 'A') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.gridMoveFocus(0, -1);
        } else
        if (event.key === 'ArrowRight' || letterKey === 'D') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.gridMoveFocus(0, 1);
        } else 
        if (event.key === 'Home') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.el.imageList.firstChild.focus();
        } else 
        if (event.key === 'End') {
            handled = true;
            this.lastMoveSource = 'keyboard';
            this.el.imageList.lastChild.focus();
        }
        // Select an image with E or /.
        if (letterKey === 'E' || letterKey === '/') {
            handled = true;
            if (this.lastFocusImage === document.activeElement) {
                this.imageList.toggleSelect(this.lastFocusImage.index);
            } else 
            if (this.mouseOverImage) {
                this.imageList.toggleSelect(this.mouseOverImage.index);
            }
        }
        // Zoom an image with spacebar.
        if ((event.key === ' ')) {            
            handled = true;
            if (this.lastMoveSource === 'keyboard') {
                if (this.lastFocusImage === document.activeElement) {
                    this.switchToZoomModal(this.lastFocusImage.index);
                }    
            } else
            if (this.lastMoveSource === 'mouse') {
                if (this.mouseOverImage) {
                    this.lastFocusImage = this.mouseOverImage;
                    this.switchToZoomModal(this.mouseOverImage.index);
                }
            }
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // Set the modal title.
    setTitle(value) {
        this.title = value;
        this.el.title.innerText = value ?? 'Image Picker';
    }

    // Update the label on the Send button.
    updateSendButton(label) {
        const selectedCount = this.imageList.selectedCount;

        this.el.sendButton.innerText = label ?? 
            `Send (${selectedCount})`;

        this.el.sendButton.disabled = selectedCount < 1;
    }  

    // Set the list of images to display.
    setImageList(value) {
        this.imageList = value;
        this.lastFocusCoords = null;
        value.addEventListener('image-select', this.handlerImageSelect);

        // Populate the grid of images.
        this.el.imageList.innerText = '';
        for (let i = 0; i < value.length; i++) {            
            const el = new ImageListImageElement();
            el.tabIndex = 0;
            el.setImageList(value, i);
            el.addEventListener('image-click', this.handlerImageClick);
            el.addEventListener('image-mousedown', this.handlerImageMouseDown);
            el.addEventListener('mouseenter', this.handlerImageMouseEnter);
            el.addEventListener('mouseleave', this.handlerImageMouseLeave);            
            el.addEventListener('focus', this.handlerImageFocus);     
            this.el.imageList.appendChild(el);
        }
    }

    // Invoked when an image is clicked.
    onImageClick(event) {
        const detail = event.detail;        
        this.imageList.toggleSelect(detail.index);
        
        // Reset focus back to the modal to avoid focus outlines on the images when not using keyboard.
        this.focus();
    }

    // Invoked when the mouse enters an image.
    onImageMouseEnter(event) {
        this.mouseOverImage = event.target;
        this.lastMoveSource = 'mouse';
    }

    // Invoked when the mouse leaves an image.
    onImageMouseLeave() {
        this.mouseOverImage = null;
        this.lastMoveSource = 'mouse';
    }

    // Invoked when mousedown on an image.
    onImageMouseDown(event) {
        const detail = event.detail;
        if (detail.button === 1) {            
            this.switchToZoomModal(detail.index);
        }
    }

    // Invoked when an image in the grid receives focus.
    onImageFocus(event) {
        this.lastFocusImage = event.srcElement;        
    }

    // Get an image from the grid by ites coordinate position.
    getImageFromGrid(x, y) {
        return this.el.imageList.querySelector(`*[data-grid-x="${x}"][data-grid-y="${y}"]`);
    }

    // Move the focused element in the grid.
    // The grid coordinate system has X as the rows and Y as the column.
    gridMoveFocus(deltaX, deltaY) {
        if (!this.lastFocusImage) {
            this.el.imageList.firstChild.focus();
        } else {
            const gridX = Number(this.lastFocusImage.getAttribute('data-grid-x')),
                gridY = Number(this.lastFocusImage.getAttribute('data-grid-y')),
                focusEl = this.getImageFromGrid(gridX + deltaX, gridY + deltaY);
            
            // When focus element doesn't exist, we're at the edge of the grid.
            (focusEl ? focusEl : this.lastFocusImage)?.focus();
        }
    }

    // Invoked when the selection in the image list changes.
    onImageSelect() {
        this.updateSendButton();
    }

    // Invoked when the Send button is clicked.
    onSend() {
        this.remove();
        this.resolve('send');
    }

    // Invoked when the Cancel button is clicked.
    onCancel() {
        this.detach();
        this.resolve('cancal');
    }

    // Switch to the zoom modal.
    async switchToZoomModal(index) {
        const zoomModal = new ZoomModal({
            title: this.title,
            imageList: this.imageList,
            index
        });

        this.detach();
        await zoomModal.attach();

        switch (await zoomModal.result) {
            case 'back': 
                // Back to the grid view.
                await this.attach();

                // Make the last viewed image in the modal the last focused image so keyboard moves behave correctly.
                // Actually set the image to focused if the modal was opened by keyboard.
                const index = zoomModal.el.image.index,
                    zoomCurrentImage = this.el.imageList.children[index];
                this.lastFocusImage = zoomCurrentImage;
                (this.lastMoveSource === 'keyboard') ? zoomCurrentImage.focus() : this.focus()                
                break;
            case 'send': 
                this.onSend();
                break;    
            case 'cancel': 
                this.onCancel();
                break;
        };
    }
}

customElements.define('liebs-picker-grid-modal', GridModal);
