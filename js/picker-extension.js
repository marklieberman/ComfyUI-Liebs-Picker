import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

import { GridModal } from "./modal/GridModal.js";
import { ImageList } from "./ImageList.js";

/**
 * Generate a unique identifier using current millis and random.
 */
function generatePickerTabId() {
    return `${new Date().valueOf()}_${Math.floor(Math.random() * 1000)}`
}

// Generate or restore the picker tab ID.
const PICKER_TAB_ID_KEY  = 'liebsPickerTabId';
var pickerTabId = sessionStorage.getItem(PICKER_TAB_ID_KEY);
if (pickerTabId) {
    console.log('Restored picker tab ID', pickerTabId);
} else {
    pickerTabId = generatePickerTabId();
    sessionStorage.setItem(PICKER_TAB_ID_KEY, pickerTabId);
}

// Python node type.
const NODE_TYPE = 'LiebsPicker';

// Register the ComfyUI extension.
app.registerExtension({
	name: "LiebsPicker",
    settings: [
        {
            id: "ImagePicker.OpenZoomed",
            name: "Open in Single Image View",
            type: "boolean",
            defaultValue: false
        },
    ],
    setup() {
        // Inject the styles for this extension.
        const el = document.createElement('link');
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('type', 'text/css');
        el.setAttribute('href', new URL("./styles.css", import.meta.url).href);
        document.head.appendChild(el);

        // Add a listener for image picking.
        api.addEventListener("liebs-picker-images", async (event) => { 
            const detail = event.detail;

            if (pickerTabId !== detail.picker_tab_id) {
                // Not the tab that ran the prompt.
                return;
            }

            // Contains the list of images and their selection status.
            const imageList = new ImageList(detail.urls);
            
            // Show the modal.
            const modal = new GridModal({
                title: detail.title,
                imageList,                
            });

            if (app.extensionManager.setting.get('ImagePicker.OpenZoomed')) {
                modal.switchToZoomModal(0);
            } else {
                await modal.attach();
            }

            // Wait for the modal to be resolved.            
            const body = new FormData();
            body.append('picker_tab_id', detail.picker_tab_id);
            switch(await modal.result) {
                case 'send': 
                    body.append('result', 'send');
                    body.append('selection', imageList.selectedIndexes.join(','));
                    break;
                case 'cancel': 
                    body.append('result', 'cancel');
                    body.append('selection', '');
                    break;
            };
            api.fetchApi("/liebs-picker-message", { 
                method: "POST", 
                body 
            });
        });
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === NODE_TYPE) { 
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {     
                const r = onNodeCreated?.apply(this, arguments);

                // Add a custom widget for the hidden picker_tab_id input.
                // Nothing is displayed in the node.
                this.addCustomWidget({
                    type: 'STRING',
                    name: 'picker_tab_id',
                    computeSize() {
                        return [0,0]
                    },
                    async serializeValue(nodeId, widgetIndex) {
                        return pickerTabId;
                    }
                });

                // Add a custom widget for the hidden title input.
                // Pass the node title in case the workflow changes.
                const node = this;
                this.addCustomWidget({
                    type: 'STRING',
                    name: 'title',
                    computeSize() {
                        return [0,0]
                    },
                    async serializeValue(nodeId, widgetIndex) {
                        return node.title
                    }
                });

                return r;
            }
        }
    }
})

/**
 * We generate a unique ID for each tab running ComfyUI. This unique "picker tab ID" makes the messages from the prompt 
 * server addressable to the tabs. The picker tab ID is stored in sessionStorage so it will persist even when the tab 
 * is refreshed. 
 * 
 * The Duplicate Tab function in browsers will also duplicate the sessionStorage contents. Using a BroadcastChannel, we 
 * can ask other ComfyUI tabs if the picker tab ID we restored is already being used. A new picker tab ID can be 
 * generated if so.
 */

// Setup a channel to communicate with other tabs running ComfyUI.
const broadcastChannel = new BroadcastChannel('liebs-picker');
broadcastChannel.addEventListener('message', (event) => {    
    const message = event.data;    
    switch (message?.topic) {
        // Another tab is asking for our picker tab ID.
        case 'getPickerTabId':            
            broadcastChannel.postMessage({
                topic: 'usingPickerTabId',
                pickerTabId
            });
            break;
        // Another tab is reporting which picker tab ID it is using.
        case 'usingPickerTabId':            
            if (message.pickerTabId === pickerTabId) {
                // Need to generate a new picker tab ID.
                pickerTabId = generatePickerTabId();
                sessionStorage.setItem(PICKER_TAB_ID_KEY, pickerTabId);
                console.log('Generated a new picker tab ID', pickerTabId);
            }
    }
});

// Ask all of the other tabs for their picker tab ID.
broadcastChannel.postMessage({
    topic: 'getPickerTabId'
});
