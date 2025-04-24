from .liebs_picker import LiebsPicker

NODE_CLASS_MAPPINGS = {
    "LiebsPicker": LiebsPicker,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LiebsPicker": "Image Picker",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]