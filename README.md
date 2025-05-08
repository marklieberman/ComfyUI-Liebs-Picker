# ComfyUI-Liebs-Picker

A node to pause execution of the workflow and select which input images should proceed to the output. Pairs well with [ComfyUI-Liebs-Toast](https://github.com/marklieberman/ComfyUI-Liebs-Toast) to get a toast notification when the picker is available.

## Features

* Display a modal dialog with the images to select.

* Switch between a grid view and a single image view.

* **Pass images** selection mode to select desired images and send them through.

* **Filter images** selection mode to flag unwanted images and send remaining images.

* Modal can be operated with only keyboard (WASD or Arrow) or only mouse controls.

* Modal only displays in the browser tab that was running the workflow.

### Screenshots

| Screenshot | Description |
| :---- | :---- |
| <img src="./docs/images/workflow.png" width="500"/> | The node accepts a batch of images and returns a filtered batch of images. When the node runs, execution will pause and an image picker dialog will be displayed.
| <img src="./docs/images/grid-modal.png" width="500"/> | Images are displayed in a grid for selection. |
| <img src="./docs/images/zoom-modal.png" width="500"/> | Single image mode allows you to view each image using all available space. |
| <img src="./docs/images/filter-mode.png" width="500"/> | **Pass images** mode is a positive selection where you pick specific images to pass through. **Filter images** mode is a negative selection where you pick specific images to discard. | 
| <img src="./docs/images/picker-filter.png" width="500"/> | You can flag both wanted and unwanted images at the same time to help you process a large batch. |
| <img src="./docs/images/image-buttons.png" width="500"/> | Hidden buttons appear when the mouse cursor hovers over the top-right of an image. |
| <img src="./docs/images/settings.png" width="500"/> | The modal behaviour and default selection mode are configurable. |

## Controls

* Middle-click or Spacebar toggles between grid view and single image view.

* E, forward-slash /, or left-click to select or deselect images.

* X or single-quote ' to flag unwanted images.

* **Filter images** mode: the select action (E,/,click) is swapped with flag unwanted action (X,').

* [Mouse-over the top-right of an image to reveal button controls](./docs/images/image-buttons.png).

* Enter to proceed with selection, or Escape to cancel workflow.

### Grid view

* Arrows keys or WASD to nagivate between images in the grid view.

* Toggle selected images with number keys 1-9 and 0.

### Single image view

* Mouse-wheel, Left/Right arrow keys, or AD keys to navigate between images in single image view.

## Credits

This node was developed using the techniques from [cg-image-filter](https://github.com/chrisgoringe/cg-image-filter) by @chrisgoringe.

## Changelog

__1.1.0__

* Added **filter images** mode.

__1.0.0__

* Intial release
