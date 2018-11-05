#!/usr/bin/env node
/**
 * js-license-ranger. A simple script to generate a 3rd party license file out
 * of javascript bundles. Requires https://www.npmjs.com/package/source-map-explorer.
 *
 * Copyright 2018 Kopano and its licensors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

'use strict';

/* eslint-disable no-console */

const fs = require('fs'),
  glob = require('glob'),
  path = require('path'),
  sourcemapExplorer = require('source-map-explorer');

const version = '20181031-1'; // eslint-disable-line

const licenseFilenames = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENSE.MIT',
  'COPYING',
  'license',
  'license.md',
  'license.txt'
];

function findModuleViaPackageJSON(mp) {
  const p = mp.split('/');
  while (p.length > 0) {
    const bp = p.join('/') + '/package.json';
    if (fs.existsSync(bp)) {
      return p.join('/');
    }

    p.pop();
  }
}

function findLicense(mp) {
  const json = JSON.parse(fs.readFileSync(mp + '/package.json', 'utf-8'));
  let url = json.repository;
  if (url && url.url) {
    url = url.url;
  }
  const result = {
    name: json.name,
    url: url,
    description: json.description,
    license: json.license
  };

  // Search for license file.
  for (let i=0; i < licenseFilenames.length; i++) {
    const fn = mp + '/' + licenseFilenames[i];
    if (fs.existsSync(fn)) {
      result.licenseFile = fn;
      return result;
    }
  }

  // Ensure package json has a license if no file was found.
  if (!result.license) {
    throw new Error('no license found: ' + mp);
  }

  return result;

}

function getModulesPath(prefix, modules, parts) {
  const p = parts.slice(0);
  while (p.length > 0) {
    const m = p.shift();
    let mp = `${prefix}${m}`;
    if (fs.existsSync(mp)) {

      if (!fs.lstatSync(mp).isDirectory()) {
        mp = path.dirname(mp);
      }

      const found = findModuleViaPackageJSON(mp);
      if (!modules[found]) {
        console.error('+ found', found);
        modules[found] = findLicense(found);
      }
    } else {
      console.error('! failed', mp);
    }

    prefix += m + '/node_modules/';
  }
}

function updateThirdPartyModules(modules, files) {
  const finds = Object.keys(files);

  for (let i=0; i < finds.length; i++) {
    const parts = finds[i].split('/node_modules/');
    if (parts.length === 1) {
      continue;
    }
    const first = parts.shift();
    if (parts.length < 1) {
      console.error('- skipped', first);
      continue;
    }
    getModulesPath(`./node_modules/`, modules, parts);
  }
}

function printLicensesDocument(modules) {
  const keys = Object.keys(modules);
  keys.sort();

  for (let i=0; i< keys.length; i++) {
    const key = keys[i];
    const entry = modules[key];
    const name = entry.name ? entry.name : key;
    let headline = name;
    if (entry.url) {
      headline += ' - ' + entry.url;
    }

    console.log('### ' + headline);
    if (entry.description) {
      console.log('\n> ' + entry.description + '\n');
    }
    if (entry.license) {
      console.log('License: ' + entry.license + '\n');
    }
    if (entry.licenseFile) {
      const license = fs.readFileSync(entry.licenseFile, 'utf-8');
      console.log('```');
      console.log(license);
      console.log('```\n');
    }
  }
}

// Main.
if (require.main === module) { // eslint-disable-line no-undef
  const modules = {};
  const files = glob.sync('./build/static/js/*.js');
  console.error('Bundles:', files);

  files.forEach((f) => {
    console.error('> processing', f);
    const data = sourcemapExplorer.loadSourceMap(f, `${f}.map`);
    const sizes = sourcemapExplorer.computeGeneratedFileSizes(data.mapConsumer, data.jsData);

    const files = sourcemapExplorer.adjustSourcePaths(sizes.files, false);
    updateThirdPartyModules(modules, files);
  });

  console.error(`Found: ${Object.keys(modules).length} modules`);

  // Print to stdout.
  printLicensesDocument(modules);
}
