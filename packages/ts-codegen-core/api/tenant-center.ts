import { createRequest } from '../config/axios.config';

 const serviceName = 'tenant-center';

 export interface TenantCenterBrandGetlatestbrandGetDTO {
  brand?: string;
  url?: string;
}
/**
 * 获取最新品牌信息及配置
 */
export const TenantCenterBrandGetlatestbrandGet = createRequest<
  TenantCenterBrandGetlatestbrandGetDTO,
  WebResultPublishedBrandVersionVo
>("TenantCenterBrandGetlatestbrandGet", ({ brand, url }) => ({
  url: `/tenant-center/brand/getLatestBrand`,
  method: "get",
  params: {
    brand,
    url,
  },
  headers: { "Service-Name": serviceName },
}));

export interface TenantCenterBrandGetlatestvercodeGetDTO {
  brand?: string;
}
/**
 * 获取最新品牌发布版本信息
 */
export const TenantCenterBrandGetlatestvercodeGet = createRequest<
  TenantCenterBrandGetlatestvercodeGetDTO,
  WebResultPublishedBrandVersionVo
>("TenantCenterBrandGetlatestvercodeGet", ({ brand }) => ({
  url: `/tenant-center/brand/getLatestVerCode`,
  method: "get",
  params: {
    brand,
  },
  headers: { "Service-Name": serviceName },
}));

export interface AreaCodeDto {
  cityCode?: string;
  districtCode?: string;
  provinceCode?: string;
}

export interface BrandBusinessScopeVo {
  areas?: string[];
  scope?: number;
  scopeAreas?: AreaCodeDto[];
}

export interface BrandConfigVo {
  appEnabled?: boolean;
  appLogo?: string;
  businessScope?: BrandBusinessScopeVo;
  censorEnabled?: boolean;
  censorModules?: string[];
  copyright?: string;
  favicon?: string;
  footerLogoUrl?: string;
  indexNavLogoUrl?: string;
  otherFooters?: OtherFooterDto[];
  otherNavLogoUrl?: string;
  pcAnonymousAccessEnabled?: boolean;
  privacyClause?: string;
  privacyClauseApp?: string;
  privacyClauseWeb?: string;
  publicRecord?: PublicRecordDto;
  recordNumber?: string;
  registerEnabled?: boolean;
  registerOption?: number;
  sidebarConfig?: SidebarConfigDto;
  simpleNavLogoUrl?: string;
  siteName?: string;
  siteNameFormat?: string;
  technicalSupport?: string;
  userAgreement?: string;
  userAgreementApp?: string;
  userAgreementWeb?: string;
  webTitle?: string;
}

export interface BrandModuleConfigMiniVo {
  icon?: string;
  moduleKey?: string;
  moduleName?: string;
  moduleNameAlias?: string;
  moduleRuleConfigList?: ModuleRuleConfigVo[];
  moduleType?: string;
  subModuleConfigList?: BrandModuleConfigMiniVo[];
}

export interface BrandModulesMenuSimpleVo {
  checked?: boolean;
  children?: BrandModulesMenuSimpleVo[];
  moduleKey: string;
  moduleName: string;
  moduleNameAlias?: string;
  moduleRuleCheckType?: string;
  moduleRuleList?: ModuleRuleDto[];
  moduleType?: string;
}

export interface ModuleRuleConfigVo {
  id?: string;
  moduleId?: string;
  moduleKey?: string;
  moduleRuleKey?: string;
  moduleRuleName?: string;
  ruleList?: RuleDto[];
  ruleOnOffList?: RuleOnOffDto[];
}

export interface ModuleRuleDto {
  checked?: boolean;
  enable: number;
  moduleRuleList?: ModuleRuleDto[];
  ruleKey?: string;
  ruleName?: string;
}

export interface OperatorVo {
  creatorId?: string;
  creatorName?: string;
}

export interface OtherFooterDto {
  footerName?: string;
  footerValue?: string;
  sort?: number;
}

export interface PublicRecordDto {
  recordCode?: string;
  recordUrl?: string;
}

export interface PublishBrandVo {
  apiDomain?: string;
  apiDomainContextPath?: string;
  appLogo?: string;
  appName?: string;
  brand?: string;
  brandConfig?: BrandConfigVo;
  brandDescription?: string;
  brandId?: string;
  brandModules?: BrandModuleConfigMiniVo[];
  brandModulesV2?: BrandModulesMenuSimpleVo[];
  brandName?: string;
  brandState?: number;
  brandTenant?: TenantSimpleVo;
  brandType?: number;
  envCode?: string;
  version?: string;
  webDomain?: string;
  webDomainContextPath?: string;
}

export interface PublishedBrandVersionVo {
  brand?: string;
  brandState?: number;
  creator?: OperatorVo;
  publishBrand?: PublishBrandVo;
  publishTime?: string;
  ver?: string;
  version?: string;
}

export interface RuleDto {
  checked?: boolean;
  ruleKey?: string;
  ruleName?: string;
  subRules?: RuleDto[];
}

export interface RuleOnOffDto {
  checked?: boolean;
  onOffKey?: string;
  onOffValue?: string;
}

export interface SidebarConfigDto {
  appLogo?: string;
  appQrCodeEnabled?: boolean;
  appQrCodeUrl?: string;
  feedbackEnabled?: boolean;
  feedbackUrl?: string;
  questionsCustomName?: string;
  questionsEnabled?: boolean;
  questionsUrl?: string;
}

export interface Status {
  code?: number;
  desc?: string;
}

export interface TenantSimpleVo {
  tenant?: string;
  tenantName?: string;
}

export interface WebResultPublishedBrandVersionVo {
  data?: PublishedBrandVersionVo;
  status?: Status;
  timestamp?: number;
}
