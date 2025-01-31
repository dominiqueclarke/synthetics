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

import { Tracing, filterFilmstrips } from '../../src/plugins/tracing';
import { Gatherer } from '../../src/core/gatherer';
import { Server } from '../utils/server';
import { wsEndpoint } from '../utils/test-config';

describe('tracing', () => {
  let server: Server;
  beforeAll(async () => {
    server = await Server.create();
  });
  afterAll(async () => {
    await server.close();
  });

  it('should capture filmstrips', async () => {
    const driver = await Gatherer.setupDriver({ wsEndpoint });
    const tracer = new Tracing();
    await tracer.start(driver.client);
    await driver.page.goto(server.TEST_PAGE);
    /**
     * Introduce a delay to make sure there are enough
     * trace events
     */
    await driver.page.waitForTimeout(100);
    const events = await tracer.stop(driver.client);
    await Gatherer.dispose(driver);
    const filmstrips = filterFilmstrips(events);
    expect(filmstrips.length).toBeGreaterThan(0);
    expect(filmstrips[0]).toMatchObject({
      snapshot: expect.any(String),
      ts: expect.any(Number),
      startTime: expect.any(Number),
    });
  });
});
