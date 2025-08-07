import { api } from "../../scripts/api.js";

/**
 * Segment data for an image.
 */
export class Segments extends EventTarget {
    
    constructor(segments) {
        super();

        this.sizes = [];
        this.bboxes = [];
        this.label = [];
        this.labels = [];
        this.masks = [];

        for (const seg of segments) {
            this.sizes.push(seg.size);
            this.bboxes.push(seg.bbox);
            this.label.push(seg.label || 'unknown');
            this.labels.push(seg.labels || []);
            this.masks.push(seg.mask);
        }
    }

    // Get the URL for the image at index.
    getMaskUrl (segn) {
        const url = this.masks[segn];
        if (url) {
            return api.apiURL(`/view?filename=${encodeURIComponent(url.filename)}&type=${url.type ?? "input"}&subfolder=${url.subfolder ?? ""}&r=${Math.random()}`);
        }
        return null;
    }

    nextLabel(segn, offset = 1) {
        const labels = this.labels[segn];

        // Get the index of the next label in the list of options.
        let index = labels.indexOf(this.label[segn]);
        index = (index === -1) ? 0 : (index + offset) % labels.length;
        if (index < 0) {
            index = labels.length - 1;
        }
        this.label[segn] = labels[index];

        this.dispatchEvent(new CustomEvent('segment-change', {
            detail: {
                segn,
                label: this.label[segn]
            }
        }));
    }

}
