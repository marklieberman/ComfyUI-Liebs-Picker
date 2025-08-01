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

        this.classList.add('segs-control');
        
        this.bboxClickHandler = this.onBBoxClick.bind(this);
        this.segmentChangeHander = this.onSegmentChange.bind(this);
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