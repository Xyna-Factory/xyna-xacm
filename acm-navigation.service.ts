/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Injectable } from '@angular/core';
import { ActivationStart, NavigationEnd, Router } from '@angular/router';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';


export enum ScreenreaderPriority {
    Off       = 'off',       // supported by all major screen readers
    Polite    = 'polite',    // speaks, when user is not doing anything - screen reader will not interrupt - is supported by all major screen readers.
    Assertive = 'assertive' // screen reader usually interrupts the user
}


@Injectable()
export class ACMNavigationService {

    private readonly navigationEndSubject = new Subject<NavigationEnd>();
    private readonly urlIdSubject = new BehaviorSubject<string>('');

    /**
     * the NavigationEnd event is thrown by angular if the route of the history has completely resolved
     * (e.g. passed all guards) Includes history changes through popstates
     */
    get navigationEndChange(): Observable<NavigationEnd> {
        return this.navigationEndSubject.asObservable();
    }

    /**
     * returns the route config id if such a route is activated
     */
    get urlIdChange(): Observable<string> {
        return this.urlIdSubject.asObservable();
    }

    get urlIdKey(): string {
        return this.lastIdKey;
    }

    private lastId = '';
    private lastIdKey = '';

    constructor(private readonly router: Router) {

        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe({
            next: ne => this.navigationEndSubject.next(ne)
        });

        this.router.events.subscribe(e => {
            if (e instanceof ActivationStart) {
                const path = e.snapshot.routeConfig.path;
                const idIndicationIndex = path.indexOf(':');
                if (idIndicationIndex >= 0) {
                    this.lastIdKey = path.substring(idIndicationIndex + 1);
                    const id = e.snapshot.params[this.urlIdKey];
                    this.lastId = id;
                } else {
                    this.lastId = '';
                }
            }

            if (e instanceof NavigationEnd) {
                this.urlIdSubject.next(this.lastId);
            }
        });

    }
}
