import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { WebSocketService } from './core/services/web-socket.service';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { NotificationCenterService } from './core/services/notification-center.service';
import { OfflineService } from './core/services/offline.service';
import { OfflineQueueService } from './core/services/offline-queue.service';
import { SwUpdateService } from './core/services/sw-update.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { of, BehaviorSubject } from 'rxjs';
import { Component } from '@angular/core';

@Component({
  selector: 'ion-app',
  standalone: true,
  template: '<ng-content></ng-content>'
})
class MockIonApp {}

@Component({
  selector: 'app-navigation-menu',
  standalone: true,
  template: ''
})
class MockNavMenu {}

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: ''
})
class MockOfflineBanner {}

@Component({
  selector: 'ion-router-outlet',
  standalone: true,
  template: ''
})
class MockIonRouterOutlet {}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  let wsSpy: any;
  let authSpy: any;
  let toastSpy: any;
  let pwaSpy: any;
  let notificationSpy: any;
  let offlineSpy: any;
  let queueSpy: any;
  let swSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    wsSpy = jasmine.createSpyObj('WebSocketService', [
      'init', 'connect', 'subscribeToUser', 'disconnect', 
      'onNewFollower', 'onMatchUpdate', 'onSocialEvent', 'onGlobalSocialEvent'
    ]);
    authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'tryRestoreSession', 'getCurrentUserId']);
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    pwaSpy = jasmine.createSpyObj('PwaService', ['init', 'initPushNotifications']);
    notificationSpy = jasmine.createSpyObj('NotificationCenterService', ['init']);
    offlineSpy = jasmine.createSpyObj('OfflineService', ['isOffline']);
    queueSpy = jasmine.createSpyObj('OfflineQueueService', ['init']);
    swSpy = jasmine.createSpyObj('SwUpdateService', ['checkForUpdates', 'init']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authSpy.isAuthenticated.and.returnValue(false);
    authSpy.tryRestoreSession.and.returnValue(of(false));
    authSpy.getCurrentUserId.and.returnValue('test-user-123');
    authSpy.currentToken$ = new BehaviorSubject<string | null>(null);

    wsSpy.onNewFollower.and.returnValue(of({ followerId: 'follower-1' }));
    wsSpy.onMatchUpdate.and.returnValue(of({ message: 'Goal scored!', matchId: 'match-1' }));
    wsSpy.onSocialEvent.and.returnValue(of({ type: 'comment', targetType: 'match', targetId: 'match-1' }));
    wsSpy.onGlobalSocialEvent.and.returnValue(of({ type: 'follow' }));

    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastSpy.create.and.returnValue(Promise.resolve(mockToast));

    offlineSpy.isOffline = new BehaviorSubject(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslocoPipe, MockIonApp, MockNavMenu, MockOfflineBanner, MockIonRouterOutlet],
      providers: [
        { provide: WebSocketService, useValue: wsSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: PwaService, useValue: pwaSpy },
        { provide: NotificationCenterService, useValue: notificationSpy },
        { provide: OfflineService, useValue: offlineSpy },
        { provide: OfflineQueueService, useValue: queueSpy },
        { provide: SwUpdateService, useValue: swSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ]
    })
    .overrideComponent(AppComponent, {
      set: { 
        imports: [TranslocoPipe, MockIonApp, MockNavMenu, MockOfflineBanner, MockIonRouterOutlet],
        template: `
          <ion-app>
            <app-navigation-menu></app-navigation-menu>
            <app-offline-banner></app-offline-banner>
            <ion-router-outlet></ion-router-outlet>
          </ion-app>
        `
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    
    // Default mock setup for toast returns
    toastSpy.create.and.callFake((options: any) => {
      return Promise.resolve({ 
        present: () => Promise.resolve(),
        options: options // keep track of options
      });
    });
  });

  it('should create and initialize services', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(wsSpy.onNewFollower).toHaveBeenCalled();
    expect(pwaSpy.initPushNotifications).toHaveBeenCalled();
    expect(swSpy.init).toHaveBeenCalled();
  });

  it('should connect websocket when user is authenticated', fakeAsync(() => {
    const token = 'valid-token';
    authSpy.currentToken$.next(token);
    authSpy.getCurrentUserId.and.returnValue('user-123');
    
    fixture.detectChanges();
    tick();

    expect(wsSpy.connect).toHaveBeenCalled();
    expect(wsSpy.subscribeToUser).toHaveBeenCalledWith('user-123');
    expect(notificationSpy.init).toHaveBeenCalledWith('user-123');
  }));

  it('should disconnect websocket when user logs out', fakeAsync(() => {
    authSpy.currentToken$.next(null);
    
    fixture.detectChanges();
    tick();

    expect(wsSpy.disconnect).toHaveBeenCalled();
  }));

  it('should show toast on new follower', fakeAsync(() => {
    const followerData = { followerId: 'follower-123' };
    wsSpy.onNewFollower.and.returnValue(of(followerData));
    
    fixture.detectChanges();
    tick();

    expect(toastSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'You have a new follower!'
    }));
  }));

  it('should navigate to profile on follower toast action', async () => {
    const followerData = { followerId: 'follower-123' };
    wsSpy.onNewFollower.and.returnValue(of(followerData));
    
    let capturedOptions: any;
    toastSpy.create.and.callFake((options: any) => {
      capturedOptions = options;
      return Promise.resolve({ present: () => Promise.resolve() });
    });

    // Directly call the private method
    (component as any).setupSocialNotifications();

    // Use a small delay to allow the async subscription to fire
    await new Promise(resolve => setTimeout(resolve, 50));

    if (capturedOptions && capturedOptions.buttons) {
      const viewButton = capturedOptions.buttons.find((b: any) => b.text === 'View');
      if (viewButton && viewButton.handler) {
        viewButton.handler();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/user-profile', 'follower-123']);
      } else {
        fail('View button or handler not found in toast buttons');
      }
    } else {
      fail('Toast options or buttons not captured correctly');
    }
  });

  it('should show goal notification on match update', fakeAsync(() => {
    wsSpy.onMatchUpdate.and.returnValue(of({ message: 'GOAL!!!', matchId: 'm1' }));
    
    fixture.detectChanges();
    tick();

    expect(toastSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
      color: 'danger'
    }));
  }));
});
