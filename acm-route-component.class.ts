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
import { Location } from '@angular/common';
import { Component, inject, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcFormDirective, XDSIconName } from '@zeta/xc';

import { Observable, of, Subject } from 'rxjs';

import { ACMApiService } from './acm-api.service';
import { RTC, XACM_WF } from './acm-consts';
import { ACMNavigationService } from './acm-navigation.service';
import { AcmRemoteTableDataSource } from './acm-remote-table-source.class';
import { ACMSettingsService } from './acm-settings.service';
import { acm_route_translations_de_DE } from './locale/acm-translations.de-DE';
import { acm_route_translations_en_US } from './locale/acm-translations.en-US';
import { ACMTableObject } from './xo/acm-table-object.model';
import { XoDomainArray } from './xo/xo-domain.model';


@Component({
    template: '',
    imports: [
    RouterModule
]
})
export abstract class ACMRouteComponent<T extends ACMTableObject> extends RouteComponent {

    protected readonly injector = inject(Injector);
    protected readonly apiService = inject(ACMApiService);
    protected readonly i18nService = inject(I18nService);
    protected readonly dialogService = inject(XcDialogService);
    protected readonly settings = inject(ACMSettingsService);
    protected readonly location = inject(Location);

    @ViewChild('detailsForm', { read: XcFormDirective, static: false })
    detailsPanelForm: XcFormDirective;

    get invalid(): boolean {
        return this.detailsPanelForm ? this.detailsPanelForm.invalid : false;
    }

    tableDataSource: AcmRemoteTableDataSource<T>;

    private readonly _cacheMaxAge = 1000 * 30; // 30s

    private _lastDomainsCacheUpdate = 0;
    private _domainsCache: XoDomainArray;

    private readonly router: Router;
    private readonly route: ActivatedRoute;
    private readonly acmNavigationService: ACMNavigationService;

    private curObj: T;
    set currentObject(value: T) {
        if (value) {
            this.curObj = value;
            this.currentObjectChangeSubject.next(value);
            if (value.hashedUniqueKey) {
                this.updateUrl();
            }
        }
    }

    get currentObject(): T {
        return this.curObj;
    }

    private readonly currentObjectChangeSubject = new Subject<T>();

    get currentObjectChange() {
        return this.currentObjectChangeSubject.asObservable();
    }

    get isGerman() {
        return (this.i18nService.language === LocaleService.DE_DE);
    }

    get isEnglish() {
        return (this.i18nService.language === LocaleService.EN_US);
    }

    constructor() {
        super();
        this.i18nService.setTranslations(LocaleService.DE_DE, acm_route_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, acm_route_translations_en_US);


        this.router = this.injector.get(Router);

        this.route = this.injector.get(ActivatedRoute);
        this.acmNavigationService = this.injector.get(ACMNavigationService);

        this.tableDataSource = new AcmRemoteTableDataSource(this.apiService, this.i18nService, RTC, this.getTableWorkflow());

        this.tableDataSource.selectionModel.selectionChange.subscribe({ next: model => this.currentObject = model.selection[0] ? model.selection[0].clone() : null });

        this.tableDataSource.actionElements = [
            {
                iconName: XDSIconName.COPY,
                onAction: row => {
                    this.copy(row);
                },
                tooltip: this.i18nService.translate('xmcp.xacm.acm-route.copy')
            },
            {
                iconName: XDSIconName.DELETE,
                onAction: row => {
                    this.delete(row);
                },
                tooltip: this.i18nService.translate('xmcp.xacm.acm-route.delete')
            }
        ];

        this.tableDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        this.acmNavigationService.urlIdChange.subscribe(hashedUniqueKey => {
            const uniqueKey = this.tableDataSource.findUniqueKey(hashedUniqueKey);
            this.tableDataSource.restoreSelectionKeys([uniqueKey], !this.tableDataSource.numberOfRefreshes);
        });

        this.beforeInitTableRefresh();
    }

    /**
     * ACMRouteComponent - Constructor Hook - after tableDataSource instanciation
     * The ACMRouteComponent handles the initial table refresh but depending on the input screen
     * some modification has to be done before hand - ()
     */
    beforeInitTableRefresh() {

    }

    private updateUrl(): void {
        const uid = this.currentObject?.hashedUniqueKey;
        const prefix = this.getRoutePrefix();

        const segments = this.router.url.split('/').filter(Boolean);

        const index = segments.lastIndexOf(prefix);

        if (index !== -1) {
            if (segments.length > index + 1) {
                segments[index + 1] = uid;
            } else if (uid) {
                segments.push(uid);
            }
        }

        const newUrl = '/' + segments.join('/');
        this.location.replaceState(newUrl);
    }

    protected abstract getRoutePrefix(): string;

    private getUrlQueries(): { [key: string]: string } {
        const qstr = window.location.search.substring(1);
        if (qstr) {
            const raw = qstr.split('&');
            const qobj = {};
            raw.forEach(rstr => {
                const index = rstr.indexOf('=');
                Object.defineProperty(qobj, rstr.substr(0, index), { value: rstr.substr(index + 1), enumerable: true });
            });
            return qobj;
        }
        return {};
    }

    refresh(withRestore = false) {
        const uniqueKey = this.currentObject ? this.currentObject.uniqueKey : '';

        if (withRestore && uniqueKey) {
            this.tableDataSource.restoreSelectionKeys([uniqueKey], true);
        }
        this.tableDataSource.refresh();
    }

    closeDetails() {
        this.currentObject = null;
        this.tableDataSource.selectionModel.clear();
    }

    copy(tableObject?: T) { }

    delete(tableObject?: T) { }

    protected abstract getTableWorkflow(): string;

    protected getDomainsObservable(refreshCache = false): Observable<XoDomainArray> {

        const now = Date.now();
        let observable: Observable<XoDomainArray>;

        const wf = XACM_WF.xmcp.xacm.usermanagement.GetDomains;
        const subj = new Subject<XoDomainArray>();

        if (refreshCache || !this._domainsCache || now > this._lastDomainsCacheUpdate + this._cacheMaxAge) {

            this.apiService.startOrder(RTC, wf, [], XoDomainArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(
                result => {
                    if (result && !result.errorMessage) {
                        this._domainsCache = result.output[0] as XoDomainArray;
                        this._lastDomainsCacheUpdate = now;
                        subj.next(this._domainsCache);
                    } else {
                        subj.error(result ? result.errorMessage : 'error');
                    }
                },
                error => subj.error(error),
                () => subj.complete()
            );
            observable = subj.asObservable();

        } else {
            observable = of(this._domainsCache);
        }
        return observable;
    }


    onShow() {
        const qparam = this.getUrlQueries();
        let uniqueKey = '';

        // this.route.params is synchronious observable
        const sub = this.route.params.subscribe(params => {
            uniqueKey = params.uniqueKey;
            void Promise.resolve().then(() => sub.unsubscribe());
        });

        this.tableDataSource.tableWait(!this.tableDataSource.numberOfRefreshes).subscribe(_ => {
            uniqueKey = uniqueKey || qparam.uniqueKey;
            if (uniqueKey) {
                uniqueKey = this.tableDataSource.findUniqueKey(uniqueKey);
                this.tableDataSource.restoreSelectionKeys([uniqueKey || qparam.uniqueKey]);
            }
            // writes current url to the table filters - does not work somehow!
            if (qparam.uniqueKey) {
                delete qparam.uniqueKey;
            }
            Object.keys(qparam).forEach(path => {
                this.tableDataSource.setFilter(path, qparam[path]);
            });
            if (Object.keys(qparam).length > 0) {
                this.tableDataSource.refresh();
            }
        });

        super.onShow();
    }
}
