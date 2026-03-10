import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { PwaService } from './core/services/pwa.service';
import { SwUpdateService } from './core/services/sw-update.service';

describe('AppComponent', () => {
  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: PwaService,
          useValue: {
            initPushNotifications: jasmine.createSpy('initPushNotifications')
          }
        },
        {
          provide: SwUpdateService,
          useValue: {
            init: jasmine.createSpy('init')
          }
        },
        {
          provide: Store,
          useValue: {
            dispatch: jasmine.createSpy('dispatch'),
            select: () => of(null)
          }
        }
      ]
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
