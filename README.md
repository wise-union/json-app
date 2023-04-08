# json-app

This project plans to use the most basic JS techniques that everyone has mastered to build a modular web app easily. it helps people to create UI templates by using JSON data structures and to construct reusable UI modules only with need of JS functions. In this way, so long as people master the most basic knowledge, they can develop modern web apps well.

## Usage Examples
1、dropdown.js
```js
const jsonArrayComponent = require("../../lib/json-array-component/jsonArrayComponent");

module.exports = jsonArrayComponent.factory({
    div: [
        {"$class": "dropdown-menu"},
        {"$style": "{{style}}"},
        {"$for": "item of {{itemArr}}"},
        {a: [
            {"$existIf": "item.{{isItem}}"},
            {"$class": "dropdown-item"},
            {"$href": "#"},
            {"$innerText": "item.{{text}}"}
        ]},
        {div: [
            {"$existIf": "item.{{isDivider}}"},
            {"$class": "dropdown-divider"}
        ]}
    ]
})
```
2、index.js
```js
const dropdownMaker = require('./dropdown.js');
const data_arr = [{
    itemArr: [
        {
            isItem: true,
            text: 'AAA'
        },
        {
            isItem: true,
            text: 'BBB'
        },
        {
            isDivider: true
        },
        {
            isItem: true,
            text: 'CCC'
        }
    ]
}]
const ele = dropdownMaker().compile(data_arr)[0];
document.body.appendChild(ele);
```
3、build bundle.js
```
npx esbuild index.js --bundle --outfile=bundle.js
```

4、index.html
```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>demo</title>
        <link href="../lib/bootstrap/bootswatch-5/dist/flatly/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
        <link rel="stylesheet" href="../lib/bootstrap/css/font/bootstrap-icons.css">
    </head>
    <body class="layout-fixed"></body>
    <script src="../lib/bootstrap/bootswatch-5/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="./bundle.js"></script>
</html>

```

