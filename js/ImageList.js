import { api } from "../../scripts/api.js";
import { Segments } from "./Segments.js";

/**
 * A list of images to display and their selected state.
 */
export class ImageList extends EventTarget {
    
    constructor(imageList) {
        super();

        this.items = [];
        for (let i = 0; i < imageList.length; i++) {
            let item = {
                url: imageList[i].url,
                segments: new Segments(imageList[i].segments),
                selected: false,
                unwanted: false
            };

            this.items.push(item);
        }
    }

    get length() {
        return this.items.length;
    }

    // Count selected items in the list.
    get selectedCount() {
        let count = 0;
        for (const image of this.items) {
            if (image.selected) {
                count++;
            }
        }
        return count;
    }

    // Get an array of the selected indexes.
    get selectedIndexes() {
        let result = []
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].selected) {
                result.push(i);
            }
        }
        return result;
    }

    // Count wanted items in the list.
    get wantedCount() {
        let count = 0;
        for (const image of this.items) {
            if (!image.unwanted) {
                count++;
            }
        }
        return count;
    }

    // True if the image at index is selected, otherwise false.
    isSelected(index) {
        return this.items[index].selected;
    }

    // Select or de-select the image at index.
    select(index, value) {
        this.items[index].selected = value;
        this.dispatchEvent(new CustomEvent('image-select', {
            detail: {
                imageList: this,
                index,
                selected: value,
                unwnated: this.items[index].unwanted
            }            
        }));
    }

    // Toggle selection of the image at index.
    toggleSelect(index) {
        const selected = this.items[index].selected;
        this.select(index, !selected);
        return selected;
    }

    // Get the URL for the image at index.
    getImageUrl (index) {
        const url = this.items[index].url;
        return api.apiURL(`/view?filename=${encodeURIComponent(url.filename)}&type=${url.type ?? "input"}&subfolder=${url.subfolder ?? ""}&r=${Math.random()}`);
    }

    // True if the image at index is unwanted, otherwise false.
    isUnwanted(index) {
        return this.items[index].unwanted;
    }

    // Want or unwant the image at index.
    unwanted(index, value) {
        this.items[index].unwanted = value;
        this.dispatchEvent(new CustomEvent('image-unwanted', {
            detail: {
                imageList: this,
                index,
                selected: this.items[index].selected,
                unwanted: value
            }            
        }));
    }

    // Toggle unwanted of the image at index.
    toggleUnwanted(index) {
        const unwanted = !this.items[index].unwanted;
        this.unwanted(index, unwanted);
        return unwanted;
    }

    // -------------------------------------------------------------------------
    // Segments

    // Get the segment information for the image at index.
    getImageSegments(index) {
        return this.items[index].segments;
    }

    // -------------------------------------------------------------------------

    // Applied a selection by selecting or unwanting by index.
    selectAndLock(selected, locked) {
        if (selected === 'all') {
            for (const item of this.items) {
                item.selected = !locked;                
            }
        } else
        if (selected === 'none') {
            for (const item of this.items) {
                item.selected = false;                
            }
        } else {
            // Parse the selection into an array of indexes.
            selected = selected.split(',')
                .map(i => Number.parseInt(i))
                .filter(i => Number.isFinite(i))
                // Convert 1-based list to 0-based index.
                .map(i => i - 1)
                .filter(i => (i >= 0) && (i < this.items.length))

            if (selected.length) {
                // When the selection is locked, instead of picking the selected items - unwant the unselected items.
                for (let i = 0; i < this.items.length; i++) {
                    let isSelected = selected.includes(i);
                    if (isSelected && !locked) {
                        this.select(i, true);
                    } else
                    if (!isSelected && locked) {
                        this.unwanted(i, true);
                    }
                }
            }
        }
        
    }

    getResult() {
        const result = []
        for (const [i, item] of Object.entries(this.items)) {
            if (item.selected) {
                result.push({
                    index: Number(i),
                    segments: {
                        label: item.segments.label
                    }
                })
            }
        }
        return result;
    }

}
