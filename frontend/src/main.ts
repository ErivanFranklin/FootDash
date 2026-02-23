import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, ErrorHandler } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './app/core/i18n/transloco.loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { HttpErrorInterceptor } from './app/core/interceptors/http-error.interceptor';
import { GlobalErrorHandler } from './app/core/handlers/global-error.handler';
import { environment } from './environments/environment';

// Initialize Ionicons with asset path
import { addIcons } from 'ionicons';
import { setAssetPath } from '@ionic/core/components';
import { home, people, heart, person, globe, logOutOutline, football, chatbubbles } from 'ionicons/icons';

// Set the path for Ionicons SVG assets
setAssetPath('/assets');

addIcons({ home, people, heart, person, globe, logOutOutline, football, chatbubbles });

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    // Ensure HttpClient is provided before other framework providers that may
    // instantiate services which depend on it (Ionic/router can create
    // components early). Placing provideHttpClient before provideIonicAngular
    // avoids `NG0201: No provider found for _HttpClient` in some setups.
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi()
    ),
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions()
    ),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pt', 'es'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
}).catch(err => {
  console.error("ERROR-> ", err);
});
