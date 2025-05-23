import dns from 'dns';
import file from './file.js';
import preLogger from './logger.js';
import { Options } from '../models/options.js';

const isUrl = (val: string): boolean => {
  try {
    const parsedUrl = new URL(val);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
};

// TODO: Find a better way to check url existence
const isUrlExists = (source: string): Promise<boolean> =>
  new Promise((resolve, reject): void => {
    try {
      const parsedUrl = new URL(source);
      dns.resolve(parsedUrl.hostname, (err) => {
        if (err) {
          return resolve(false);
        }
        return resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });

const getAddress = async (
  source: string,
  options: Options,
): Promise<string> => {
  const logger = preLogger(getAddress.name, options);

  if (isUrl(source)) {
    if (!(await isUrlExists(source))) {
      throw Error(
        `Cannot resolve ${source}. Please check your internet connection`,
      );
    }

    logger.log('Providing url source as navigation address');
    return source;
  }

  if (file.isHtmlFile(source)) {
    logger.log('Providing html file path as navigation address');
    return file.getFileUrlOfPath(source);
  }

  return source;
};

const getShellHtml = async (
  source: string,
  options: Options,
): Promise<string> => {
  const logger = preLogger(getShellHtml.name, options);

  const useShell = async (isSourceUrl = false): Promise<string> => {
    logger.log('Providing shell html as page content');
    return file.getHtmlShell(source, options, isSourceUrl);
  };

  if (isUrl(source)) {
    if (!(await isUrlExists(source))) {
      throw Error(
        `Cannot resolve ${source}. Please check your internet connection`,
      );
    }

    logger.log('Generating shell html with provided image url');
    return useShell(true);
  }

  if (!(await file.isPathAccessible(source, file.READ_ACCESS))) {
    throw Error(`Cannot find path ${source}. Please check if file exists`);
  }

  logger.log('Generating shell html with provided image source');
  return useShell();
};

export default { isUrl, isUrlExists, getAddress, getShellHtml };
