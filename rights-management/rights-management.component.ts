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
import { Component, Injector } from '@angular/core';

import { StartOrderOptionsBuilder, StartOrderResult } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService, XcRichListItem } from '@zeta/xc';

import { ACMApiService } from '../acm-api.service';
import { extractError, RTC, XACM_WF } from '../acm-consts';
import { ACMRouteComponent } from '../acm-route-component.class';
import { ACMSettingsService } from '../acm-settings.service';
import { XoModifyRightRequest } from '../xo/xo-modify-right-request.model';
import { XoRight, XoRightArray } from '../xo/xo-right.model';
import { ParameterRichlistItemComponent, ParameterRichlistItemData } from './items/parameter-richlist-item/parameter-richlist-item.component';
import { rights_translations_de_DE } from './locale/rights-translations.de-DE';
import { rights_translations_en_US } from './locale/rights-translations.en-US';
import { AddNewRightComponent, AddNewRightComponentData } from './modal/add-new-right/add-new-right.component';


@Component({
    selector: 'rights-management',
    templateUrl: './rights-management.component.html',
    styleUrls: ['./rights-management.component.scss'],
    standalone: false
})
export class RightsManagementComponent extends ACMRouteComponent<XoRight> {

    parameterRichlistItems: XcRichListItem<ParameterRichlistItemData>[] = [];

    constructor(
        injector: Injector,
        apiService: ACMApiService,
        i18nService: I18nService,
        dialogService: XcDialogService,
        settings: ACMSettingsService
    ) {
        super(injector, apiService, i18nService, dialogService, settings);
        this.i18nService.setTranslations(LocaleService.DE_DE, rights_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, rights_translations_en_US);

        this.currentObjectChange.subscribe({ next: () => this.syncParameterRichlistItems() });
    }

    protected getTableWorkflow(): string {
        return XACM_WF.xmcp.xacm.rightsmanagement.QueryRightsTableInfo;
    }

    get numberOfParameters(): number {
        return this.currentObject && this.currentObject.parameterList ? this.currentObject.parameterList.data.length : 0;
    }

    beforeInitTableRefresh() {
        this.tableDataSource.output = XoRightArray;
        this.tableDataSource.input = this.apiService.xoLocale;
    }

    create(refRight?: XoRight) {
        const data: AddNewRightComponentData = {
            refRight,
            i18nService: this.i18nService
        };

        this.dialogService.custom<XoRight, AddNewRightComponentData>(AddNewRightComponent, data).afterDismissResult().subscribe(right => {
            if (right) {
                this.apiService.createRight(right).subscribe(result =>
                    this.refresh(true)
                );
            }
        });
    }

    copy(row: XoRight) {
        this.create(row);
    }

    save() {
        const request = new XoModifyRightRequest();
        request.rightName = this.currentObject.rightName;
        request.documentation = this.currentObject.documentation;
        request.locale = this.apiService.xoLocale;

        this.apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rightsmanagement.ModifyRight, request, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe({
            next: (result: StartOrderResult) => {
                if (result && !result.errorMessage) {
                    this.refresh();
                    this.closeDetails();
                } else {
                    this.dialogService.error(result.errorMessage);
                }
            },
            error: error => this.dialogService.error(extractError(error))
        });
    }


    delete(tableObject?: XoRight) {
        const right = tableObject || this.currentObject;

        const questionTitle = this.i18nService.translate('xmcp.xacm.rights.question');
        const question = this.i18nService.translate('xmcp.xacm.rights.delete', { key: '%name%', value: right.rightName });

        const sendRequest = () => {
            this.apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rightsmanagement.DeleteRight, right, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(
                result => {
                    if (result && !result.errorMessage) {
                        this.currentObject = null;
                        this.refresh();
                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error => this.dialogService.error(extractError(error))
            );
        };

        this.dialogService.confirm(questionTitle, question).afterDismissResult().subscribe(res => {
            if (res) {
                sendRequest();
            }
        });

    }

    clearFilters() {
        this.tableDataSource.resetFilters();
    }

    // ParameterRichlistItemComponent extends XcRichListItemComponent<void, ParameterRichlistItemData>
    syncParameterRichlistItems() {
        this.parameterRichlistItems = [];
        if (this.currentObject && this.currentObject.parameterList && this.currentObject.parameterList.data) {

            this.currentObject.parameterList.data.forEach(p => {

                const data: XcRichListItem<ParameterRichlistItemData> = {
                    component: ParameterRichlistItemComponent,
                    data: {
                        parameter: p,
                        parameterListRef: this.currentObject.parameterList,
                        grantMode: false,
                        readonly: true
                    }
                };
                this.parameterRichlistItems.push(data);
            });
        }
    }

}
