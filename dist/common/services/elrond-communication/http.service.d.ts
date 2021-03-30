import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
export declare class HttpService {
    protected url: string;
    protected httpService: AxiosInstance;
    protected config: any;
    constructor();
    protected setup(): void;
    get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    head<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    private configWithURL;
}
