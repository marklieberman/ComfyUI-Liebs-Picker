# ComfyUI-Liebs-Picker

A node to pause execution of the workflow and select which input images should proceed to the output.

## Features

* Display a modal dialog with the images to select.

* Switch between a grid view and a single image view.

* Modal only displays in the browser tab that was running the workflow.


| Workflow example | Grid view | Single image view |
|----|----|----|
| ![Example workflow with the node](./docs/images/workflow.png) | ![Screenshot of the grid view](./docs/images/grid-modal.png) | ![Screenshot of the single image view](./docs/images/zoom-modal.png) |
| The node accepts a list of images and returns a filtered list of images. | Images are displayed in a grid for selection. | Single image mode allows you to view each image using all available space. |

## Controls

* Middle-click or spacebar toggles between grid view and single image view.

* E, forward-slash /, or left-click to select or deselect images.

* Enter to proceed with selection, or Escape to cancel workflow.

### Grid view

* Arrows keys or WASD to nagivate between images in the grid view.

* Toggle selected images with number keys 1-9 and 0.

### Single image view

* Mouse-wheel, left and right arrow keys, or AD keys to navigate between images in single image view.

## Credits

This node was developed using the techniques from [cg-image-filter](https://github.com/chrisgoringe/cg-image-filter) by @chrisgoringe.