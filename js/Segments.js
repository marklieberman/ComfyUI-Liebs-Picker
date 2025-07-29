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

        for (const seg of segments) {
            this.sizes.push(seg.size);
            this.bboxes.push(seg.bbox);
            this.label.push(seg.label || 'unknown');
            this.labels.push(seg.labels || []);
        }
    }

    nextLabel(segn) {
        const labels = this.labels[segn];

        // Get the index of the next label in the list of options.
        let index = labels.indexOf(this.label[segn]);
        index = (index === -1) ? 0 : (index + 1) % labels.length;
        this.label[segn] = labels[index];

        this.dispatchEvent(new CustomEvent('segment-change', {
            detail: {
                segn,
                label: this.label[segn]
            }
        }));
    }

}
