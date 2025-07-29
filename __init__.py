from .liebs_picker import LiebsPickerBasic, LiebsPickerSEGS

NODE_CLASS_MAPPINGS = {
    "LiebsPicker": LiebsPickerBasic,
    "LiebsPickerSEGS": LiebsPickerSEGS,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LiebsPicker": "Image Picker",
    "LiebsPickerSEGS": "Image Picker (SEGS)",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
