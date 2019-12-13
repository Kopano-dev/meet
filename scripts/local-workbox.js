#!/usr/bin/env node
/**
 * local-workbox.js. A simple script to enforce that workbox is loaded locally
 * if the service worker was generated with cdn.
 *
 * Copyright 2018 Simon Eisenmann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/* global process */

const fs = require("fs");
const copyWorkboxLibraries = require('workbox-build').copyWorkboxLibraries;

const serviceWorkerFile = './build/service-worker.js';
const workboxDestination = './build/static/js';

const version = '20181125-1'; // eslint-disable-line

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Copy workbox to destination.
copyWorkboxLibraries(workboxDestination);

const lines = [];

// Read and modify service worker to load workbox locally.
fs.readFileSync(serviceWorkerFile, 'utf-8').split(/\r?\n/).forEach(line => {
  if (line.includes('storage.googleapis.com')) {
    line = line.replace(/https:\/\/storage.googleapis.com\/workbox-cdn\/releases\//, './static/js/workbox-v');
    lines.push(line);
    const v = new RegExp(/workbox-v(.*)\//).exec(line)[1];
    lines.push(`workbox.setConfig({modulePathPrefix: "./static/js/workbox-v${v}"});`);
  } else {
    lines.push(line);
  }
});

// Write modified service worker file.
fs.writeFile(serviceWorkerFile, lines.join('\n'), 'utf-8', (err) => {
  if (err) {
    throw err;
  }
});

