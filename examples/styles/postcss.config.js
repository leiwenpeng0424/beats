/** @type {import('postcss-load-config').Config} */
module.exports = {
    plugins: [
        require("tailwindcss/nesting")(require("postcss-nesting")),
        require("tailwindcss")({
            content: ["./src/**/*.{tsx,jsx}"],
        }),
    ],
};
