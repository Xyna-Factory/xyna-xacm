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
import { inject, Injectable } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder, StartOrderResult } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { catchError, EMPTY, filter, Observable } from 'rxjs';

import { extractError, RTC, XACM_WF } from './acm-consts';
import { XoACMLocale } from './xo/xo-locale.model';
import { XoRight } from './xo/xo-right.model';


@Injectable({    
    providedIn: 'root'
})
export class ACMApiService extends ApiService {
    readonly i18n = inject(I18nService);
    private readonly dialogService = inject(XcDialogService);


    defaultStartOrderOptions1 = new StartOrderOptionsBuilder()
        .withErrorMessage(true)
        .options;

    private readonly currentXoLocale: XoACMLocale;


    constructor() {
        super();

        this.currentXoLocale = new XoACMLocale();
        this.currentXoLocale.language = this.i18n.language;
    }


    createRight(right: XoRight): Observable<StartOrderResult> {
        return this.startOrder(RTC, XACM_WF.xmcp.xacm.rightsmanagement.CreateRight, [right, this.xoLocale], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError(error => {
                this.dialogService.error(extractError(error));
                return EMPTY;
            }),
            filter(response => {
                if (response?.errorMessage) {
                    this.dialogService.error(response.errorMessage);
                }
                return response && !response.errorMessage;
            })
        );
    }


    /** @todo Add functions for all other ACM API calls (move them from their management-components into this service) */


    get xoLocale(): XoACMLocale {
        return this.currentXoLocale;
    }
}
