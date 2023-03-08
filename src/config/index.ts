import { envload } from './env_load';
envload();
import * as config from 'config';

/**
 * Wallet object configuration.
 * Has 3rd party API hosts and other configurations
 */
export const mxConfig = config.get('multiversX');
/**
 * Caching time config.
 * The values are in seconds
 */

export const fileStorage = config.get('fileStorage');
export const gas = config.get('gas');

export const cronJobs = config.get('cronJobs');

export const constants = config.get('constants');

export const genericDescriptions = config.get('genericDescriptions');

export const ports = config.get('ports');

export const elasticDictionary = config.get('elasticDictionary');
