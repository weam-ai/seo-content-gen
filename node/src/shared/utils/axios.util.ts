import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';

export function createAxiosWithLogging(
  config: AxiosRequestConfig,
  label = 'Axios',
): AxiosInstance {
  const instance = axios.create(config);
  const logger = new Logger(label);
  const isProduction = process.env.NODE_ENV !== 'development';

  if (!isProduction) {
    instance.interceptors.request.use((reqConfig) => {
      reqConfig.headers['x-request-start'] = Date.now();
      logger.log(
        `➡️  [REQUEST] ${reqConfig.method?.toUpperCase()} ${reqConfig.baseURL}${reqConfig.url}`,
      );
      if (reqConfig.data) {
        logger.debug(`Payload: ${JSON.stringify(reqConfig.data)}`);
      }
      return reqConfig;
    });

    instance.interceptors.response.use(
      (response) => {
        const start = Number(response.config.headers['x-request-start']);
        const durationSec = ((Date.now() - start) / 1000).toFixed(2);
        logger.log(
          `✅  [RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status} - ⏱️ ${durationSec}s`,
        );
        return response;
      },
      (error) => {
        const { config, response } = error;
        const start = Number(config?.headers?.['x-request-start']);
        const durationSec = start
          ? `${((Date.now() - start) / 1000).toFixed(2)}s`
          : 'N/A';

        logger.error(
          `❌  [ERROR] ${config?.method?.toUpperCase()} ${config?.url} - Status: ${response?.status ?? 'N/A'} - ⏱️ ${durationSec}`,
        );
        logger.error(`Message: ${error.message}`);

        const properError =
          error instanceof Error
            ? error
            : new Error(
                typeof error === 'string' ? error : JSON.stringify(error),
              );

        return Promise.reject(properError);
      },
    );
  }

  return instance;
}
