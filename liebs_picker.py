import time
import torch
from aiohttp import web
from server import PromptServer
from comfy.model_management import InterruptProcessingException, throw_exception_if_processing_interrupted
from nodes import PreviewImage

mailbox = {}

"""
Handler to receive messages from the frontend.
"""
@PromptServer.instance.routes.post('/liebs-picker-message')
async def liebs_picker_message(request):
    json = await request.json()    
    picker_tab_id = json.get("picker_tab_id")
    mailbox[picker_tab_id] = json
    return web.json_response({})

"""
Send a message to the frontend.
"""
def send_request(topic, data):
    PromptServer.instance.send_sync(topic, data)

class LiebsPickerSEGS(PreviewImage):
    """
    An image picker with SEGS visualizer.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "optional": {
                "selected": ("STRING", { "default": "none", "tooltip":"Comma-separated list of image indexes to select, 'all', or 'none'" }),
                "locked": ("BOOLEAN", { "default": False, "tooltip": "Prevent selected images from being changed" }),
                "segs": ("SEGS",),
                "segs_labels": ("STRING", { "tooltip":"Comma-separated list of labels for segments" }),
                "init_labels": ("BOOLEAN", {"default": True, "tooltip":"Apply segs_labels to segments automatically"})
            },
            "hidden": {
                "picker_tab_id": ("STRING",),
                "title": ("STRING",),
                "unique_id": "UNIQUE_ID",
            }
        }

    INPUT_IS_LIST = True
    OUTPUT_IS_LIST = (False, True, True)
    RETURN_TYPES = ("IMAGE", "IMAGE", "SEGS", )
    RETURN_NAMES = ("IMAGES", "IMAGES", "SEGS", )
    FUNCTION = "func"
    CATEGORY = "image_filter"
    OUTPUT_NODE = False

    def IS_CHANGED(images, picker_tab_id, title, unique_id, selected=["none"], locked=[False], segs=None, segs_labels=None, init_labels=[False]):
        return float("NaN")

    def get_segs_info(segs, seg_labels, init_labels):
        """
        Collect segment information for the fronend to visualize.
        """
        segs_info = []
        if len(segs[1]) > 0:
            for i, seg in enumerate(segs[1]):
                labels = seg_labels.copy()
                if not seg.label in labels:
                    labels.append(seg.label)

                segs_info.append({
                    "size": segs[0],
                    "bbox": seg.bbox.tolist(),
                    "label": seg_labels[i % len(seg_labels)] if init_labels[0] and seg_labels is not None and len(seg_labels) > 0 else seg.label,
                    "labels": labels
                })
        
        return segs_info

    def label_segs(segs, labels):
        """
        Replace the label of each SEG in 'segs' with the element from 'labels'.
        """
        if len(segs[1]) > 0:
            for i in range(len(segs[1])):
                segs[1][i] = segs[1][i]._replace(label=labels[i])

        return segs
    
    def get_features(self):
        """
        List of features to enable in the picker modal.
        """
        return [ "segs-controls" ]
        
    def func(self, images, picker_tab_id, title, unique_id, selected=["none"], locked=[False], segs=None, segs_labels=None, init_labels=[False]):
        assert len(picker_tab_id) == 1
        assert len(title) == 1
        assert len(unique_id) == 1
        assert len(selected) == 1
        assert len(locked) == 1

        picker_tab_id = picker_tab_id[0]
        title = title[0]
        unique_id = unique_id[0]

        # Use PreviewImage to save images to temp directory.
        urls: list[str] = [
            url
            for group in images
            for url in self.save_images(images=group)['ui']['images']
        ]
        images = [
            image
            for group in images
            for image in group
        ]

        segs_list = segs
        if segs_list is not None and len(segs_list) != len(images):
            raise Exception("Number of segs must match number of images")

        # Prepare a slot to receive a message.
        mailbox[picker_tab_id] = None

        # Collect image data for the picker modal.
        if segs_labels is not None:
            segs_labels = [tag.strip() for tag in segs_labels[0].split(",") if tag.strip()]

        image_list = []
        for i, url in enumerate(urls):
            image_list.append({
                "url": url,
                "segments": LiebsPickerSEGS.get_segs_info(segs_list[i], segs_labels, init_labels) if segs_list is not None else []
            })

        # Send a message to the frontend to display the images.
        req = ({
            "picker_tab_id": picker_tab_id, 
            "title": title, 
            "unique_id": unique_id, 
            "features": self.get_features(),
            "images": image_list,
            "selected": selected[0],
            "locked": locked[0]
        })
        send_request("liebs-picker-images", req)
        
        # Wait for a response from the frontend.
        while mailbox[picker_tab_id] is None:
            throw_exception_if_processing_interrupted()
            time.sleep(0.2)

        res = mailbox[picker_tab_id]
        del mailbox[picker_tab_id]

        if res["result"] == "cancel" or not res["selection"]:
            # User cancelled the run.
            raise InterruptProcessingException()

        # Collected selected images.
        selected_images = []
        selected_segs = []
        for item in res["selection"]:
            index = item["index"]
            image = images[index]
            selected_images.append(image)

            # Apply new labels to selected segments.
            if segs_list is not None:
                segs = LiebsPickerSEGS.label_segs(segs_list[index], item["segments"]["label"])
                selected_segs.append(segs)

        # Stack and list selected images.
        try:
            as_stack = torch.stack(selected_images)
        except RuntimeError:
            # Best effort.
            as_stack = torch.stack(selected_images[:1])

        as_list = [torch.stack([image]) for image in selected_images]
        
        return (as_stack, as_list, selected_segs, )


class LiebsPickerBasic(LiebsPickerSEGS):
    """
    The basic image picker with no bells or whistles.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "optional": {
                "selected": ("STRING", { "default": "none", "tooltip":"Comma-separated list of image indexes to select, 'all', or 'none'" }),
            },
            "hidden": {
                "picker_tab_id": ("STRING",),
                "title": ("STRING",),
                "unique_id": "UNIQUE_ID",
            }
        }

    INPUT_IS_LIST = True
    OUTPUT_IS_LIST = (False, True)
    RETURN_TYPES = ("IMAGE", "IMAGE")
    RETURN_NAMES = ("IMAGES", "IMAGES")
    FUNCTION = "func"
    CATEGORY = "image_filter"
    OUTPUT_NODE = False

    def get_features(self):
        # Do not enable any extra features.
        return []

    def IS_CHANGED(self, images, picker_tab_id, title, unique_id, selected=["none"]):
        return float("NaN")

    def func(self, images, picker_tab_id, title, unique_id, selected=["none"]):
        return super().func(images, picker_tab_id, title, unique_id, selected, [False], None, None)