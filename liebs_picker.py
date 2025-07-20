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
    post = await request.post()
    picker_tab_id = post.get("picker_tab_id")
    mailbox[picker_tab_id] = { "result": post.get("result"), "selection": post.get("selection") }
    return web.json_response({})

"""
Send a message to the frontend.
"""
def send_request(topic, data):
    PromptServer.instance.send_sync(topic, data)

class LiebsPicker(PreviewImage):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "hidden": {
                "picker_tab_id": ("STRING",),
                "title": ("STRING",),
                "unique_id": "UNIQUE_ID",
            }
        }

    INPUT_IS_LIST = True
    OUTPUT_IS_LIST = (False, True,)
    RETURN_TYPES = ("IMAGE", "IMAGE",)
    RETURN_NAMES = ("IMAGES", "IMAGES",)
    FUNCTION = "func"
    CATEGORY = "image_filter"
    OUTPUT_NODE = False

    def IS_CHANGED(images, picker_tab_id, title, unique_id):
        return float("NaN")

    def func(self, images, picker_tab_id, title, unique_id):
        assert len(picker_tab_id) == 1
        assert len(title) == 1
        assert len(unique_id) == 1

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

        # Prepare a slot to receive a message.
        mailbox[picker_tab_id] = None

        # Send a message to the frontend to display the images.
        req = ({
            "picker_tab_id": picker_tab_id, 
            "title": title, 
            "unique_id": unique_id, 
            "urls": urls
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

        selection = [int(x) for x in res["selection"].split(",") if x]
        images = [images[i] for i in selection]
        try:
            as_stack = torch.stack(images)
        except RuntimeError:
            # Best effort.
            as_stack = torch.stack(images[:1])

        as_list = [torch.stack([image]) for image in images]
        return (as_stack, as_list,)
