// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { setAssetPath } from '@ionic/core/components';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Configure Ionic/Stencils asset path to avoid URL errors in Karma/JSDOM
try {
  const base = (document as any).baseURI || (window as any).location?.href || '/';
  setAssetPath(base);
} catch {
  // no-op if document/window not available in certain environments
}
