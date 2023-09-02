'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

var e = [];
var t = [];
function n(n2, r) {
  if (n2 && "undefined" != typeof document) {
    var a, s = true === r.prepend ? "prepend" : "append", d = true === r.singleTag, i = "string" == typeof r.container ? document.querySelector(r.container) : document.getElementsByTagName("head")[0];
    if (d) {
      var u = e.indexOf(i);
      -1 === u && (u = e.push(i) - 1, t[u] = {}), a = t[u] && t[u][s] ? t[u][s] : t[u][s] = c();
    } else
      a = c();
    65279 === n2.charCodeAt(0) && (n2 = n2.substring(1)), a.styleSheet ? a.styleSheet.cssText += n2 : a.appendChild(document.createTextNode(n2));
  }
  function c() {
    var e2 = document.createElement("style");
    if (e2.setAttribute("type", "text/css"), r.attributes)
      for (var t2 = Object.keys(r.attributes), n3 = 0; n3 < t2.length; n3++)
        e2.setAttribute(t2[n3], r.attributes[t2[n3]]);
    var a2 = "prepend" === s ? "afterbegin" : "beforeend";
    return i.insertAdjacentElement(a2, e2), e2;
  }
}

var css$2 = ".index2 {\r\n    color: rebeccapurple;\r\n}\r\n.index3 {\r\n}\r\n\r\n/*\n! tailwindcss v3.3.3 | MIT License | https://tailwindcss.com\n*/\r\n\r\n/*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\r\n\r\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\r\n\r\n::before,\n::after {\n  --tw-content: '';\n}\r\n\r\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n5. Use the user's configured `sans` font-feature-settings by default.\n6. Use the user's configured `sans` font-variation-settings by default.\n*/\r\n\r\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n  font-feature-settings: normal; /* 5 */\n  font-variation-settings: normal; /* 6 */\n}\r\n\r\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\r\n\r\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\r\n\r\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\r\n\r\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\r\n\r\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\r\n\r\nabbr:where([title]) {\n  text-decoration: underline dotted;\n}\r\n\r\n/*\nRemove the default font size and weight for headings.\n*/\r\n\r\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\r\n\r\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\r\n\r\na {\n  color: inherit;\n  text-decoration: inherit;\n}\r\n\r\n/*\nAdd the correct font weight in Edge and Safari.\n*/\r\n\r\nb,\nstrong {\n  font-weight: bolder;\n}\r\n\r\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\r\n\r\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\r\n\r\n/*\nAdd the correct font size in all browsers.\n*/\r\n\r\nsmall {\n  font-size: 80%;\n}\r\n\r\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\r\n\r\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\r\n\r\nsub {\n  bottom: -0.25em;\n}\r\n\r\nsup {\n  top: -0.5em;\n}\r\n\r\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\r\n\r\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\r\n\r\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\r\n\r\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-feature-settings: inherit; /* 1 */\n  font-variation-settings: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\r\n\r\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\r\n\r\nbutton,\nselect {\n  text-transform: none;\n}\r\n\r\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\r\n\r\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\r\n\r\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\r\n\r\n:-moz-focusring {\n  outline: auto;\n}\r\n\r\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\r\n\r\n:-moz-ui-invalid {\n  box-shadow: none;\n}\r\n\r\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\r\n\r\nprogress {\n  vertical-align: baseline;\n}\r\n\r\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\r\n\r\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\r\n\r\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\r\n\r\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\r\n\r\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\r\n\r\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\r\n\r\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\r\n\r\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\r\n\r\n/*\nAdd the correct display in Chrome and Safari.\n*/\r\n\r\nsummary {\n  display: list-item;\n}\r\n\r\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\r\n\r\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\r\n\r\nfieldset {\n  margin: 0;\n  padding: 0;\n}\r\n\r\nlegend {\n  padding: 0;\n}\r\n\r\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\r\n\r\n/*\nReset default styling for dialogs.\n*/\r\n\r\ndialog {\n  padding: 0;\n}\r\n\r\n/*\nPrevent resizing textareas horizontally by default.\n*/\r\n\r\ntextarea {\n  resize: vertical;\n}\r\n\r\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\r\n\r\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\r\n\r\n/*\nSet the default cursor for buttons.\n*/\r\n\r\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\r\n\r\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\r\n\r\n:disabled {\n  cursor: default;\n}\r\n\r\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\r\n\r\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\r\n\r\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\r\n\r\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\r\n\r\n/* Make elements with the HTML hidden attribute stay hidden by default */\r\n\r\n[hidden] {\n  display: none;\n}\r\n\r\n*, ::before, ::after {\r\n    --tw-border-spacing-x: 0;\r\n    --tw-border-spacing-y: 0;\r\n    --tw-translate-x: 0;\r\n    --tw-translate-y: 0;\r\n    --tw-rotate: 0;\r\n    --tw-skew-x: 0;\r\n    --tw-skew-y: 0;\r\n    --tw-scale-x: 1;\r\n    --tw-scale-y: 1;\r\n    --tw-pan-x:  ;\r\n    --tw-pan-y:  ;\r\n    --tw-pinch-zoom:  ;\r\n    --tw-scroll-snap-strictness: proximity;\r\n    --tw-gradient-from-position:  ;\r\n    --tw-gradient-via-position:  ;\r\n    --tw-gradient-to-position:  ;\r\n    --tw-ordinal:  ;\r\n    --tw-slashed-zero:  ;\r\n    --tw-numeric-figure:  ;\r\n    --tw-numeric-spacing:  ;\r\n    --tw-numeric-fraction:  ;\r\n    --tw-ring-inset:  ;\r\n    --tw-ring-offset-width: 0px;\r\n    --tw-ring-offset-color: #fff;\r\n    --tw-ring-color: rgb(59 130 246 / 0.5);\r\n    --tw-ring-offset-shadow: 0 0 #0000;\r\n    --tw-ring-shadow: 0 0 #0000;\r\n    --tw-shadow: 0 0 #0000;\r\n    --tw-shadow-colored: 0 0 #0000;\r\n    --tw-blur:  ;\r\n    --tw-brightness:  ;\r\n    --tw-contrast:  ;\r\n    --tw-grayscale:  ;\r\n    --tw-hue-rotate:  ;\r\n    --tw-invert:  ;\r\n    --tw-saturate:  ;\r\n    --tw-sepia:  ;\r\n    --tw-drop-shadow:  ;\r\n    --tw-backdrop-blur:  ;\r\n    --tw-backdrop-brightness:  ;\r\n    --tw-backdrop-contrast:  ;\r\n    --tw-backdrop-grayscale:  ;\r\n    --tw-backdrop-hue-rotate:  ;\r\n    --tw-backdrop-invert:  ;\r\n    --tw-backdrop-opacity:  ;\r\n    --tw-backdrop-saturate:  ;\r\n    --tw-backdrop-sepia:  ;\r\n}\r\n\r\n::backdrop {\r\n    --tw-border-spacing-x: 0;\r\n    --tw-border-spacing-y: 0;\r\n    --tw-translate-x: 0;\r\n    --tw-translate-y: 0;\r\n    --tw-rotate: 0;\r\n    --tw-skew-x: 0;\r\n    --tw-skew-y: 0;\r\n    --tw-scale-x: 1;\r\n    --tw-scale-y: 1;\r\n    --tw-pan-x:  ;\r\n    --tw-pan-y:  ;\r\n    --tw-pinch-zoom:  ;\r\n    --tw-scroll-snap-strictness: proximity;\r\n    --tw-gradient-from-position:  ;\r\n    --tw-gradient-via-position:  ;\r\n    --tw-gradient-to-position:  ;\r\n    --tw-ordinal:  ;\r\n    --tw-slashed-zero:  ;\r\n    --tw-numeric-figure:  ;\r\n    --tw-numeric-spacing:  ;\r\n    --tw-numeric-fraction:  ;\r\n    --tw-ring-inset:  ;\r\n    --tw-ring-offset-width: 0px;\r\n    --tw-ring-offset-color: #fff;\r\n    --tw-ring-color: rgb(59 130 246 / 0.5);\r\n    --tw-ring-offset-shadow: 0 0 #0000;\r\n    --tw-ring-shadow: 0 0 #0000;\r\n    --tw-shadow: 0 0 #0000;\r\n    --tw-shadow-colored: 0 0 #0000;\r\n    --tw-blur:  ;\r\n    --tw-brightness:  ;\r\n    --tw-contrast:  ;\r\n    --tw-grayscale:  ;\r\n    --tw-hue-rotate:  ;\r\n    --tw-invert:  ;\r\n    --tw-saturate:  ;\r\n    --tw-sepia:  ;\r\n    --tw-drop-shadow:  ;\r\n    --tw-backdrop-blur:  ;\r\n    --tw-backdrop-brightness:  ;\r\n    --tw-backdrop-contrast:  ;\r\n    --tw-backdrop-grayscale:  ;\r\n    --tw-backdrop-hue-rotate:  ;\r\n    --tw-backdrop-invert:  ;\r\n    --tw-backdrop-opacity:  ;\r\n    --tw-backdrop-saturate:  ;\r\n    --tw-backdrop-sepia:  ;\r\n}\r\n.bg-amber-500 {\r\n    --tw-bg-opacity: 1;\r\n    background-color: rgb(245 158 11 / var(--tw-bg-opacity));\r\n}\r\n";
n(css$2,{});

var css$1 = ".link {\r\n    color: red;\r\n}\r\n";
n(css$1,{});

var css = "a,\n.link {\n  color: #428bca;\n}\na:hover {\n  color: #3071a9;\n}\n.widget {\n  color: rgba(0, 0, 0, 0.5);\n  background-color: #428bca;\n}\n";
n(css,{});

function App() {
  return /* @__PURE__ */ React.createElement("h1", { className: `bg-amber-500 ${css$1.link} ${css.link}` }, "App");
}

exports.default = App;
//# sourceMappingURL=index.js.map