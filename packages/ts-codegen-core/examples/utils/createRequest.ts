import axios, { AxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: "https://petstore.swagger.io",
});

export const createRequest = <requestType, reponseType = any>(
  _: string,
  requestConfigCreator: (args: requestType) => AxiosRequestConfig,
) => {
  return (args: requestType) => {
    return axiosInstance.request<reponseType>(requestConfigCreator(args));
  };
};
