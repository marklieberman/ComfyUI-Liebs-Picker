/**
 * Base class for modals.
 */
export class BaseModal extends HTMLElement {

    constructor() {
        super();

        this.attached = false;
        this.pendingLayoutAfterResize = false;

        // Modal can return a result via a promise.
        const self = this;
        this.result = new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        });

        // Create event handlers for instance.
        this.handlerResize = this.onResize.bind(this);
        window.addEventListener('resize', this.handlerResize);
        this.handlerKeyDown = this.onKeyDown.bind(this);
        this.addEventListener('keydown', this.handlerKeyDown);

        // Allows the modal element to recieve focus.
        this.classList.add('liebs-picker-modal');
        this.setAttribute('tabindex', '0');
    }

    // Invoked when the window is resized.
    onResize() {
        // Recalculate the layout when the window resizes, but throttle the
        // rate at which it gets called.
        const self = this;
        if (!self.pendingLayoutAfterResize) {
            self.pendingLayoutAfterResize = true;
            setTimeout(async () => {
                await self.layout();
                self.pendingLayoutAfterResize = false;
            }, 200);
        }
    }

    // Update the modal layout.
    async layout() { }

    // Attach the modal to the DOM.
    async attach() {
        if (!this.attached) {
            this.classList.add('first-layout');
            document.body.appendChild(this);
            this.attached = true;
            this.layout();            

            // Delay focus until modal is attached to DOM.
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.focus();
                    resolve();
                }, 0);
            })
        }

        return Promise.resolve();
    }

    // Detach the modal from the DOM.
    detach() {        
        if (this.attached) {
            document.body.removeChild(this);
            this.attached = false;
        }
    }

    // Handle keydown in the modal.
    onKeyDown() { }

}
