import React from 'react';

var styles1 = (function(css, namedExports) {
    if (!css || typeof document === "undefined") return;
    var container = document.getElementsByTagName("head")[0];
    var styleTag = document.createElement("style");
    styleTag.setAttribute("type", "text/css");
    container.insertAdjacentElement("afterbegin", styleTag);
    // strip potential UTF-8 BOM if css was read from a file
    if (css.charCodeAt(0) === 0xfeff) css = css.substring(1);
    if (styleTag.styleSheet) {
        styleTag.styleSheet.cssText += css;
    } else {
        styleTag.appendChild(document.createTextNode(css));
    }

    return namedExports;
})("@import \"./variable.css\";\r\n\r\n._add_1d0gn_5 {\r\n    background-color: var(--bg-color-100);\r\n}\r\n\r\n._add_1d0gn_5._name_1d0gn_11 {\r\n        background-color: green;\r\n    }\r\n\r\n/*# sourceMappingURL=index.css.map */", {"add":"_add_1d0gn_5","name":"_name_1d0gn_11"});

var styles2 = {};

function App() {
  return /* @__PURE__ */ React.createElement("h1", { className: `${styles1.add} ${styles2.link}` }, "App");
}

export { App as default };
//# sourceMappingURL=index.mjs.map
