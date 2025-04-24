import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

import { GridModal } from "./modal/GridModal.js";
import { ImageList } from "./ImageList.js";

// Python node type.
const NODE_TYPE = 'LiebsPicker';

// Create a tab ID to identify prompts run in this tab.
const pickerTabId = `${new Date().valueOf()}_${Math.floor(Math.random() * 1000)}`;

// Register the ComfyUI extension.
app.registerExtension({
	name: "LiebsPicker",
    settings: [
        {
            id: "ImagePicker.OpenZoomed",
            name: "Open in Zoomed View",
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

            if (pickerTabId !== detail.picker_id) {
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

            if (app.extensionManager.setting.get('LiebsPicker.OpenZoomed')) {
                modal.switchToZoomModal(0);
            } else {
                modal.attach();
            }

            // Wait for the modal to be resolved.            
            const body = new FormData();
            body.append('picker_id', detail.picker_id);
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
    async afterConfigureGraph(missingNodes, app) {
        // Graph changed - probably a workflow was loaded, or the workflow tab changed.
        console.log(arguments);
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === NODE_TYPE) { 
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {     
                const r = onNodeCreated?.apply(this, arguments);

                // Add a custom widget for the hidden picker_id input.
                // Nothing is displayed in the node.
                this.addCustomWidget({
                    type: 'STRING',
                    name: 'picker_id',
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


