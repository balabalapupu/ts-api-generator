forkBy:ts-codegen
增加白名单功能
## ts-codegen.config.json参数配置
```json
{
  "outputFolder": "clients",
  "requestCreateLib": "../examples/utils/createRequest",
  "requestCreateMethod": "createRequest",
  "apiSpecsPaths": [
    {
      "path": "https://xxxxx//v2/api-docs",
      "name": "xxx-center",
      "update": true,
      "updateRequest": [
        "/brand/xx",
        "/brand/xx"
      ]
    }
  ],
  "options": {
    "withComments": true,
    "typeWithPrefix": true,
    "backwardCompatible": true,
    "withServiceNameInHeader": true
  }
}

```