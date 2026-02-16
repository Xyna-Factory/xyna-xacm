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
import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogComponent, XcLocalTableDataSource, XcRichListItem, XcSelectionModel } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Subject } from 'rxjs';

import { ACMSettingsService } from '../../../acm-settings.service';
import { ParameterRichlistItemComponent, ParameterRichlistItemData } from '../../../rights-management/items/parameter-richlist-item/parameter-richlist-item.component';
import { XoRight, XoRightArray } from '../../../xo/xo-right.model';
import { XoRole } from '../../../xo/xo-role.model';
import { DynamicParameterListValidator } from './dynamic-parameter-list.validator';
import { editRight_translations_de_DE } from './locale/edit-right-translations.de-DE';
import { editRight_translations_en_US } from './locale/edit-right-translations.en-US';


export interface EditRightComponentData {
    selectedRole: XoRole;
    right: XoRight;
    allRights: XoRightArray;
    i18n: I18nService;
}

@Component({
    templateUrl: './edit-right.component.html',
    styleUrls: ['./edit-right.component.scss'],
    imports: [XcModule, I18nModule]
})
export class EditRightComponent extends XcDialogComponent<void, EditRightComponentData> {
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly settings = inject(ACMSettingsService);


    private readonly parameterValiditySubject = new Subject<Subject<boolean>>();

    rightsLocalTableDataSource: XcLocalTableDataSource<XoRight>;
    selectedRight: XoRight;

    dynamicParameterListValidatorFn = DynamicParameterListValidator.parameterListCorrect;

    get showParameterListInput(): boolean {
        return this.selectedRight ? this.selectedRight.hasParameter : false;
    }

    parameterRichlistItems: XcRichListItem<ParameterRichlistItemData>[] = [];

    editMode = false;

    constructor() {
        super();

        this.injectedData.i18n.setTranslations(LocaleService.DE_DE, editRight_translations_de_DE);
        this.injectedData.i18n.setTranslations(LocaleService.EN_US, editRight_translations_en_US);

        this.editMode = !!this.injectedData.right;

        this.rightsLocalTableDataSource = new XcLocalTableDataSource<XoRight>();
        this.rightsLocalTableDataSource.localTableData = {
            rows: [],
            columns: [
                { path: 'rightName', name: 'Right' },
                { path: 'parameterStr', name: 'Parameter Definition' } // parameterStr should be a transient property of XoRight
            ]
        };

        this.rightsLocalTableDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        if (this.editMode) {
            this.selectedRight = this.injectedData.right.clone();
            this.syncParameterRichlistItems();
        } else {
            this.syncRightsTable(false);
        }

        this.rightsLocalTableDataSource.selectionModel.selectionChange.subscribe({
             next: (model: XcSelectionModel<XoRight>) => {
                const right = model.selection[0];

                if (right) {
                    this.selectedRight = right.clone();
                } else {
                    this.selectedRight = null;
                }
                this.syncParameterRichlistItems();
                this.cdr.detectChanges();
            }
        });
    }


    private syncRightsTable(selectCurrent = true) {
        // clear() destroys the reference, so it will be copied
        const currentTemp = this.selectedRight;
        // clears all rows
        this.rightsLocalTableDataSource.clear();
        // restores the reference
        this.selectedRight = currentTemp;

        // fills the local table
        if (this.injectedData.allRights) {
            let right: XoRight;
            for (right of this.injectedData.allRights.data) {
                right.updateParameterString();
                this.rightsLocalTableDataSource.add(right);
            }
            // selects the current object
            if (selectCurrent && this.selectedRight) {
                this.rightsLocalTableDataSource.selectionModel.select(this.selectedRight);
            }

            this.rightsLocalTableDataSource.refresh();
        }

    }

    private syncParameterRichlistItems() {
        this.parameterRichlistItems = [];
        if (this.selectedRight) {

            if (this.selectedRight.parameterList) {
                this.selectedRight.parameterList.data.forEach(p => {

                    const data: XcRichListItem<ParameterRichlistItemData> = {
                        component: ParameterRichlistItemComponent,
                        data: {
                            parameter: p,
                            parameterListRef: this.selectedRight.parameterList,
                            grantMode: true,
                            validityListenerObservable: this.parameterValiditySubject.asObservable()
                        }
                    };
                    this.parameterRichlistItems.push(data);
                });
            }
        }
    }

    isFormInvalid(): boolean {
        const filterValiditySubject = new Subject<boolean>();
        let filterValid = true;
        filterValiditySubject.subscribe({ next: res => filterValid = filterValid && res });
        this.parameterValiditySubject.next(filterValiditySubject);
        return !filterValid;
    }

    private addRightToRole(right?: XoRight): boolean {
        right = right || this.selectedRight;
        if (right) {
            right.updateParameterString();

            if (!this.injectedData.selectedRole.isRightGranted(right)) {
                if (this.editMode) {
                    const beforeRightStr = this.injectedData.right.getXynaFactoryImplementedString();
                    let index = -1;
                    this.injectedData.selectedRole.rightList.data.forEach((r, i) => {
                        if (r.getXynaFactoryImplementedString() === beforeRightStr) {
                            index = i;
                        }
                    });
                    if (index >= 0) {
                        this.injectedData.selectedRole.rightList.data.splice(index, 1, right);
                    } else {
                        console.warn('edited right was not found');
                    }
                } else {
                    this.injectedData.selectedRole.rightList.data.push(right);
                }

                return true;
            }
            console.warn('right is already granted and cannot be granted again');
            return false;
        }
    }

    applyAndContinue() {

        if (this.selectedRight) {
            const right = this.selectedRight.clone();

            if ((!right.hasParameter) && this.rightsLocalTableDataSource) {
                this.rightsLocalTableDataSource.remove(this.selectedRight);
                this.selectedRight = null;
                this.rightsLocalTableDataSource.selectionModel.clear();
            }

            this.addRightToRole(right);
        }
    }

    apply() {
        this.addRightToRole();
        this.dismiss(null);
    }
}
