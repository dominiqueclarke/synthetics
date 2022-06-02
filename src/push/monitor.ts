/**
 * MIT License
 *
 * Copyright (c) 2020-present, Elastic NV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

import { mkdir } from 'fs/promises';
import { join } from 'path';
import { Bundler } from './bundler';
import { CACHE_PATH } from '../helpers';
import { LocationsMap } from '../dsl/locations';
import { Monitor, MonitorConfig } from '../dsl/monitor';

export type MonitorSchema = Omit<MonitorConfig, 'locations'> & {
  content: string;
  locations: string[];
  filter: Monitor['filter'];
};

function translateLocation(locations: MonitorConfig['locations']) {
  return locations.map(loc => LocationsMap[loc]).filter(Boolean);
}

export async function buildMonitorSchema(monitors: Monitor[]) {
  if (monitors.length == 0) {
    throw new Error('No Monitors found');
  }
  /**
   * Set up the bundle artifacts path which can be used to
   * create the bundles required for uploading journeys
   */
  const bundlePath = join(CACHE_PATH, 'bundles');
  await mkdir(bundlePath, { recursive: true });
  const bundler = new Bundler();
  const schemas: MonitorSchema[] = [];

  for (const monitor of monitors) {
    const { source, config, filter } = monitor;
    const outPath = join(bundlePath, config.name + '.zip');
    const content = await bundler.build(source.file, outPath);
    schemas.push({
      ...config,
      content,
      locations: translateLocation(config.locations),
      filter: filter,
    });
  }
  return schemas;
}