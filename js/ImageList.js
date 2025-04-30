import { api } from "../../scripts/api.js";

/**
 * A list of images to display and their selected state.
 */
export class ImageList extends EventTarget {
    
    constructor(comfyUrls) {
        super();

        this.items = [];        
        for (const url of comfyUrls) {
            this.items.push({
                url,
                selected: false,
                unwanted: false
            })
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
}
