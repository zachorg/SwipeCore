import { config } from '../config';
import * as live from './liveClient';
import * as smartMock from './mockClient';

export const places = config.apiMode === 'mock' ? smartMock : live;