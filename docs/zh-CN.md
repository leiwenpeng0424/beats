# beats

`Build for your own`

## 使用

- 安装

```bash

pnpm i beats --save-dev

# or

yarn add beats --save-dev

# or

npm i beats --save-dev

```

```json5
// package.json
{
    "scripts": {
        "build": "beats",
        "dev": "beats --watch"
    }
}

```

- 无配置执行

前置条件：

1. 在 package.json 中配置 main 和 module 以及 types 字段。

    ```
    main 对应 cjs 模块化下引用的文件。
    module 对应 esm 模块下引用的文件。
    types 对应 typescript 的 dts 文件。
    ```

    通过解析这三个字段来生成默认的配置文件，用于 beats 来生成 rollup 配置。

2. 配置 tsconfig.json 文件

    ```
    如果在 package.json 中配置了 types，想要生成 dts 文件，
    那就需要在 tsconfig.json 中声明 declaration 为 true，
    并且指定目录，declarationDir。
    ```
