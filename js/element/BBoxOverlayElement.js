import { BBoxElement } from "./BBoxElement.js";

/**
 * Element that displays bounding box overlays on an image.
 */
export class BBoxOverlayElement extends HTMLElement {

    constructor () {
        super();

        this.el = {
            bboxes: []
        };

        // This element is part of the 'segs-control' feature and should be hidden when that feature is not enabled.
        this.classList.add('segs-control');
        
        this.addEventListener('mouseleave', () => {
            // Remove hover style from all bboxes.
            for (const bbox of this.el.bboxes) {                
                bbox.classList.remove('hover');
            }
        });

        this.addEventListener('mousemove', event => {
            // Remove hover style from all bboxes.
            for (const bbox of this.el.bboxes) {                
                bbox.classList.remove('hover');                
            }

            // Update hover styles for the bbox under the mouse.
            this.testPoint(event.clientX, event.clientY, (insideBbox) => {
                insideBbox.classList.add('hover');
            });
        }, { capture: true });

        this.addEventListener('mousedown', event => {
            // Handle clicks on the bbox under the mouse.
            if (event.button === 0 || event.button === 2) {
                // Update hover styles for the bbox under the mouse.
                this.testPoint(event.clientX, event.clientY, (bbox) => {
                    this.onBBoxClick({
                        detail: {
                            button: event.button,
                            segn: this.el.bboxes.indexOf(bbox),
                            bbox
                        }
                    });
                });

                event.preventDefault();
                event.stopPropagation();

                return;
            }
        }, { capture: true });

        // Prevent the clicks from being propagated.
        this.addEventListener('click', event => {
            this.testPoint(event.clientX, event.clientY, (insideBbox) => {
                event.preventDefault();
                event.stopPropagation();
            });
        }, { capture: true });

        // Prevent the context menu from being displayed.
        this.addEventListener('contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
        }, { capture: true });

        this.segmentChangeHander = this.onSegmentChange.bind(this);
    }

    testPoint (clientX, clientY, callback) {
        for (const bbox of document.elementsFromPoint(clientX, clientY)) {
            if (bbox === this) {
                // Reached the overlay container.
                return;
            }

            if (bbox instanceof BBoxElement) {
                // Bounding box at the top of the stack.
                if(bbox.isPointInsideMask(clientX, clientY)) {
                    callback(bbox);
                    return;
                }
            }
        }
    }

    setSegments(segments) {
        this.segments = segments;
        this.segments.addEventListener('segment-change', this.segmentChangeHander);
        this.update();
    }

    update () {
        this.innerText = '';
        this.el.bboxes.length = 0;

        if (this.segments) {
            for (let segn = 0; segn < this.segments.bboxes.length; segn++) {
                const sizes = this.segments.sizes[segn],
                      bbox = this.segments.bboxes[segn],
                      label = this.segments.label[segn],
                      maskUrl = this.segments.getMaskUrl(segn);

                const bboxElement = new BBoxElement(segn, sizes, bbox, maskUrl);
                bboxElement.addEventListener('bbox-mousedown', this.bboxClickHandler);
                bboxElement.setLabel(label);                

                this.el.bboxes.push(bboxElement);
                this.appendChild(bboxElement);
            }
        }
    }

    onSegmentChange(event) {
        const detail = event.detail;
        this.el.bboxes[detail.segn].setLabel(detail.label);
    }

    onBBoxClick(event) {
        const detail = event.detail;
        switch (detail.button) {
            case 0:
                this.segments.nextLabel(detail.segn, 1);
                break;
            case 2:
                this.segments.nextLabel(detail.segn, -1);
                break;
        }
    }

}

customElements.define('liebs-picker-bbox-overlay', BBoxOverlayElement);