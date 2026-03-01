import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class OfflineService implements OnDestroy {
  private logger = inject(LoggerService);

  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  readonly isOnline$: Observable<boolean> = this.onlineSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  private onlineEvent$ = fromEvent(window, 'online').pipe(map(() => true));
  private offlineEvent$ = fromEvent(window, 'offline').pipe(map(() => false));

  private sub = merge(this.onlineEvent$, this.offlineEvent$).subscribe(status => {
    this.logger.info(`[Offline] Network status changed: ${status ? 'online' : 'offline'}`);
    this.onlineSubject.next(status);
  });

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
