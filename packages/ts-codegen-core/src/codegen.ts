import { getFilename, toJSONObj, hasHttpOrHttps, getUnifiedInputs, isOpenApi } from "./utils";
import axios from "axios";
import { isEmpty } from "lodash";
import * as fs from "fs";
import * as path from "path";
import { scan, printOutputs } from "./core";
import { ERROR_MESSAGES, SERVICE_VARIABLE_NAME } from "./constants";
import { CustomSpec, CodegenConfig, ApiSpecsPath } from "./__types__/types";
import yaml from "js-yaml";
// "#/components/schemas/Res"
const allRegexDefinition = /#\/definitions\/([^"]*)/g;
const groupRegex = /#\/definitions\/([^"]*)/;
const allRegexDefinitionOpenApi = /#\/components\/schemas\/([^"]*)/g;
const groupRegexOpenApi = /#\/components\/schemas\/([^"]*)/;
export const codegen = (codegenConfig = getCodegenConfig()) => {
  const { apiSpecsPaths } = codegenConfig;

  if (isEmpty(apiSpecsPaths)) {
    console.error(ERROR_MESSAGES.EMPTY_API_SPECS_PATHS);
    return;
  }
  apiSpecsPaths.forEach((item) => {
    hasHttpOrHttps(item.path) ? handleRemoteApiSpec(item, codegenConfig) : handleLocalApiSpec(item, codegenConfig);
  });
};

function extractCaptureGroups(input: string): string[] {
  const matches = input.match(allRegexDefinition);
  let captureGroups: string[] = [];
  if (matches) {
    captureGroups = matches
      .map((match) => {
        const matchGroup = match.match(groupRegex);
        if (matchGroup) {
          return matchGroup[1];
        }
        return "";
      })
      .filter((group) => group !== "");
  }
  return captureGroups;
}

function extractCaptureGroupsOpenApi(input: string): string[] {
  const matches = input.match(allRegexDefinitionOpenApi);
  let captureGroups: string[] = [];
  if (matches) {
    captureGroups = matches
      .map((match) => {
        const matchGroup = match.match(groupRegexOpenApi);
        if (matchGroup) {
          return matchGroup[1];
        }
        return "";
      })
      .filter((group) => group !== "");
  }
  return captureGroups;
}
const getFilePath = (configPath?: string, jsonConfigPath?: string, jsConfigPath?: string) => {
  if (configPath && fs.existsSync(configPath)) {
    return configPath;
  }

  if (jsonConfigPath && fs.existsSync(jsonConfigPath)) {
    return jsonConfigPath;
  }

  if (jsConfigPath && fs.existsSync(jsConfigPath)) {
    return jsConfigPath;
  }

  throw new Error(ERROR_MESSAGES.NOT_FOUND_CONFIG_FILE);
};

export const getCodegenConfig = (configPath?: string): CodegenConfig => {
  const jsonConfigPath = path.resolve("ts-codegen.config.json");
  const jsConfigPath = path.resolve("ts-codegen.config.js");
  const filePath = getFilePath(configPath, jsonConfigPath, jsConfigPath);

  return require(filePath);
};

const handleRemoteApiSpec = async (item: ApiSpecsPath, codegenConfig: CodegenConfig) => {
  const { data, fileType } = (await fetchRemoteSpec(item.path)) || {};
  const getResponseData = () => data;

  covertAndWrite(fileType, getResponseData, codegenConfig, item.name);
};

const handleLocalApiSpec = (item: ApiSpecsPath, codegenConfig: CodegenConfig) => {
  const fileType = path.extname(item.path).split(".")[1];
  const getFileStr = () => fs.readFileSync(item.path, "utf8");

  covertAndWrite(fileType, getFileStr, codegenConfig, item.name);
};

const updateSpecByHooks = (codegenConfig: CodegenConfig, spec: CustomSpec) => {
  return codegenConfig.hooks?.beforeConvert ? codegenConfig.hooks?.beforeConvert(spec) : spec;
};

function findDefinitionTypesArr(currentArray: string[], res: any, totalNewDefinition: any) {
  currentArray.forEach((item) => {
    if (totalNewDefinition[item] && !res[item]) {
      res[item] = totalNewDefinition[item];
      const curDefinitionType = JSON.stringify(totalNewDefinition[item]);
      const resultArray = extractCaptureGroups(curDefinitionType);
      findDefinitionTypesArr(resultArray, res, totalNewDefinition);
    }
  });
  return res;
}

function findDefinitionTypesArrOpenApi(currentArray: string[], res: any, totalNewDefinition: any) {
  currentArray.forEach((item) => {
    if (totalNewDefinition[item] && !res[item]) {
      res[item] = totalNewDefinition[item];
      const curDefinitionType = JSON.stringify(totalNewDefinition[item]);
      const resultArray = extractCaptureGroupsOpenApi(curDefinitionType);
      findDefinitionTypesArrOpenApi(resultArray, res, totalNewDefinition);
    }
  });
  return res;
}

function convertOriginTypeList(originData: any, updateRequest: string[], __data: any) {
  updateRequest.forEach((item) => {
    const curTargetUrlDetail = __data?.paths[item];
    if (curTargetUrlDetail && originData.paths) {
      originData.paths[item] = curTargetUrlDetail;
    }
    if (curTargetUrlDetail && __data.definitions) {
      const inputURLString = JSON.stringify(curTargetUrlDetail);
      const currentArray = extractCaptureGroups(inputURLString);
      const res: any = findDefinitionTypesArr(currentArray, {}, __data.definitions);
      if (originData.definitions && Object.keys(res).length > 0) {
        Object.keys(res).forEach((__item) => {
          originData.definitions[__item] = res[__item];
        });
      }
    }
  });
  return originData;
}

function convertOriginTypeListOpenApi(originData: any, updateRequest: string[], __data: any) {
  updateRequest.forEach((item) => {
    const curTargetUrlDetail = __data?.paths[item];
    if (curTargetUrlDetail && originData.paths) {
      originData.paths[item] = curTargetUrlDetail;
    }
    if (curTargetUrlDetail && __data.components.schemas) {
      const inputURLString = JSON.stringify(curTargetUrlDetail);
      const currentArray = extractCaptureGroupsOpenApi(inputURLString);
      const res: any = findDefinitionTypesArrOpenApi(currentArray, {}, __data.components.schemas);
      if (originData.components.schemas && Object.keys(res).length > 0) {
        Object.keys(res).forEach((__item) => {
          originData.components.schemas[__item] = res[__item];
        });
      }
    }
  });
  return originData;
}
/**
 * step3 转化和覆写都在这里
 * @param fileType
 * @param getData
 * @param codegenConfig
 * @param filename
 * @returns
 */
const covertAndWrite = (
  fileType: string = "",
  getData: () => string,
  codegenConfig: CodegenConfig,
  filename?: string,
) => {
  if (!fileType) {
    return;
  }
  const validFileType = ["json", "yaml", "yml"];

  if (!validFileType.includes(fileType)) {
    throw new Error(ERROR_MESSAGES.INVALID_FILE_EXT_ERROR);
  }
  let __data: any = getData();
  const spec = toJSONObj(__data, ERROR_MESSAGES.INVALID_JSON_FILE_ERROR);
  if (!isOpenApi(spec)) {
    const curApiSpecsConfig = codegenConfig.apiSpecsPaths.find((item) => item.name == filename);
    if (curApiSpecsConfig?.update && curApiSpecsConfig?.updateRequest && curApiSpecsConfig.updateRequest.length > 0) {
      // 过滤 现在只有swagger2的格式
      const originJson = codegenConfig?.outputFolder + "/" + filename + ".json";
      if (fs.existsSync(originJson)) {
        // 需要有源文件
        const getOriginData = () => fs.readFileSync(originJson, "utf8");
        let __originData = JSON.parse(getOriginData());
        // 找到新文件的url和类型，放到旧的里面，反正有 tree-shaking,问题不大
        if (curApiSpecsConfig.updateRequest && curApiSpecsConfig?.updateRequest.length > 0) {
          __data = convertOriginTypeList(__originData, curApiSpecsConfig.updateRequest, spec);
        }
      } else {
        // 没有源文件
        const __originData = {
          ...__data,
          paths: {},
          definitions: {},
        };
        if (curApiSpecsConfig.updateRequest && curApiSpecsConfig?.updateRequest.length > 0) {
          __data = convertOriginTypeList(__originData, curApiSpecsConfig.updateRequest, spec);
        }
      }
    }

    writeOriginFile(codegenConfig.outputFolder || "client", `./${filename}`, JSON.stringify(__data));
  } else {
    debugger
    const curApiSpecsConfig = codegenConfig.apiSpecsPaths.find((item) => item.name == filename);
    if (curApiSpecsConfig?.update && curApiSpecsConfig?.updateRequest && curApiSpecsConfig.updateRequest.length > 0) {
      // 过滤 现在只有swagger2的格式
      const originJson = codegenConfig?.outputFolder + "/" + filename + ".json";
      if (fs.existsSync(originJson)) {
        // 需要有源文件
        const getOriginData = () => fs.readFileSync(originJson, "utf8");
        let __originData = JSON.parse(getOriginData());
        // 找到新文件的url和类型，放到旧的里面，反正有 tree-shaking,问题不大
        if (curApiSpecsConfig.updateRequest && curApiSpecsConfig?.updateRequest.length > 0) {
          __data = convertOriginTypeListOpenApi(__originData, curApiSpecsConfig.updateRequest, spec);
        }
      } else {
        // 没有源文件
        const __originData = {
          ...__data,
          paths: {},
          components: {
            schemas: {},
          },
        };
        if (curApiSpecsConfig.updateRequest && curApiSpecsConfig?.updateRequest.length > 0) {
          __data = convertOriginTypeListOpenApi(__originData, curApiSpecsConfig.updateRequest, spec);
        }
      }
    }

    writeOriginFile(codegenConfig.outputFolder || "client", `./${filename}`, JSON.stringify(__data));
  }

  // handle json file
  if (isJSON(fileType)) {
    const spec = toJSONObj(__data, ERROR_MESSAGES.INVALID_JSON_FILE_ERROR);
    writeSpecToFile(updateSpecByHooks(codegenConfig, spec), codegenConfig, filename);
    return;
  }

  // handle yaml file
  try {
    const spec = yaml.load(__data) as CustomSpec;
    writeSpecToFile(updateSpecByHooks(codegenConfig, spec), codegenConfig, filename);
  } catch (e) {
    console.log(e);
  }
};

/**
 *
 * @param spec
 * @param codegenConfig
 * @param filename
 * @returns
 */
const writeSpecToFile = (spec: CustomSpec, codegenConfig: CodegenConfig, filename?: string) => {
  const { outputFolder, requestCreateLib, requestCreateMethod, options, hooks } = codegenConfig;

  if (!spec) {
    return;
  }
  const importLib = `import { ${requestCreateMethod} } from '${requestCreateLib}';\n\n`;
  const { clientConfigs, decls } = scan(spec, options, hooks);
  const { basePath } = getUnifiedInputs(spec, filename);
  const serviceNameStr = options?.withServiceNameInHeader ? `const ${SERVICE_VARIABLE_NAME} = '${filename}';\n\n` : "";
  const fileStr = `${importLib} ${serviceNameStr} ${printOutputs(clientConfigs, decls, requestCreateMethod, options)}`;
  write(outputFolder || "clients", `./${filename || getFilename(basePath)}`, fileStr);
};

const writeOriginFile = (output: string, filename: string, str: string) => {
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }
  fs.writeFileSync(path.resolve(output, `./${filename}.json`), str, "utf-8");
};

const write = (output: string, filename: string, str: string) => {
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }

  fs.writeFileSync(path.resolve(output, `./${filename}.ts`), str, "utf-8");
};

const fetchRemoteSpec = (url: string, timeout: number = 180000) => {
  const instance = axios.create({ timeout });

  return instance
    .get(url)
    .then((response) => {
      return {
        data: response.data,
        fileType: getFileTypeByContentType(response.headers["content-type"]),
      };
    })
    .catch((error) => {
      console.error(`${error.code}: ${ERROR_MESSAGES.FETCH_CLIENT_FAILED_ERROR}`);
    });
};

const isJSON = (ext: string) => ext.includes("json");

const getFileTypeByContentType = (contentType: string) => {
  if (contentType.includes("json")) {
    return "json";
  }

  if (contentType.includes("yaml") || contentType.includes("yml")) {
    return "yaml";
  }

  return "";
};
