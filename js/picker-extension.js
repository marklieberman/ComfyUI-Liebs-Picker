import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

import { GridModal } from "./modal/GridModal.js";
import { ImageList } from "./ImageList.js";

// Ensures picker nodes have a unique identifier if more than one appears in
// the graph.
var counter = 1;

// Python node type.
const NODE_TYPE = 'LiebsPicker';

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
            const data = event.detail;

            // Determine if the picker exists in this graph before handling
            // the message.     
            const node = app.graph
                .findNodesByType(NODE_TYPE)
                .find(n => n.pickerId === data.picker_id)

            if (!node) {
                // The message is not for this graph.
                return;
            }

            // Contains the list of images and their selection status.
            const imageList = new ImageList(data.urls);
            
            // Show the modal.
            const modal = new GridModal({
                title: node.title,
                imageList,                
            });

            if (app.extensionManager.setting.get('LiebsPicker.OpenZoomed')) {
                modal.switchToZoomModal(0);
            } else {
                modal.attach();
            }

            // Wait for the modal to be resolved.            
            const body = new FormData();
            body.append('picker_id', data.picker_id);
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

                // Generate a unique identifier for this picker instance.
                const pickerId = `${new Date().valueOf()}_${++counter}`;
                this.pickerId = pickerId;
                
                // Add a custom widget for the hidden picker_id input.
                // Nothing is displayed in the node.
                this.addCustomWidget({
                    type: 'STRING',
                    name: 'picker_id',
                    size: [0,0],
                    async serializeValue(nodeId, widgetIndex) {
                       return pickerId;
                    }
                });

                return r;
            }
        }
    }
})


