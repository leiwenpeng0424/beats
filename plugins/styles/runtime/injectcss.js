const isClient = typeof window === "object";

const __inserted = [];

function noop() {}

function inject(css, id, { once, insertBefore } = {}) {
    if (!css) return noop;

    let element = null;
    let head = null;

    if (isClient) {
        element = document.createElement("style");
        element.setAttribute("type", "text/css");
        element.setAttribute("id", id);
        element.textContent = css;

        head = document.getElementsByTagName("head")[0];

        if (insertBefore) {
            head.insertBefore(element, head.firstChild);
        } else {
            head.appendChild(element);
        }

        __inserted.push(id);
    }
}

module.exports = inject;

