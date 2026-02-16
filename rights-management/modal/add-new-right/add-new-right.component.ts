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
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';

import { I18nParam, I18nService, LocaleService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogComponent, XcFormDirective, XcRichListItem } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Subject } from 'rxjs';

import { RightParameterType, XoRightParameter, XoRightParameterArray } from '../../../xo/xo-right-parameter.model';
import { XoRight } from '../../../xo/xo-right.model';
import { ParameterRichlistItemComponent, ParameterRichlistItemData } from '../../items/parameter-richlist-item/parameter-richlist-item.component';
import { addNewRight_translations_de_DE } from './locale/add-new-right-translations.de-DE';
import { addNewRight_translations_en_US } from './locale/add-new-right-translations.en-US';
import { RightNameValidator } from './right-name.validator';


export interface AddNewRightComponentData {
    refRight?: XoRight;
    i18nService: I18nService;
}

@Component({
    templateUrl: './add-new-right.component.html',
    styleUrls: ['./add-new-right.component.scss'],
    imports: [XcModule, I18nModule]
})
export class AddNewRightComponent extends XcDialogComponent<XoRight, AddNewRightComponentData> {
    private readonly cdr = inject(ChangeDetectorRef);


    @ViewChild(XcFormDirective, {static: false})
    modalForm: XcFormDirective;

    get invalid(): boolean {
        const validItems = this.getItemsValidity();
        return this.modalForm ? (this.modalForm.invalid || !validItems) : false;
    }

    parameterRichlistItems: XcRichListItem<ParameterRichlistItemData>[] = [];

    right: XoRight = new XoRight();

    rightNameValidatorFN = RightNameValidator.rightNameFN;

    rightNameHelp = 'xmcp.xacm.rights.add-new-right.right-name-help';
    rightNameExp = '"xact.device_w06a.access"';

    // important that the string has no indent
    parameterHelpText = 'xmcp.xacm.rights.add-new-right.parameter-help-text';

    translatedNameHelp: string;
    translatedParameterHelp: string;

    showNameHelp = false;
    showParameterHelp = false;

    private readonly parameterValiditySubject = new Subject<Subject<boolean>>();

    constructor() {
        super();

        this.injectedData.i18nService.setTranslations(LocaleService.DE_DE, addNewRight_translations_de_DE);
        this.injectedData.i18nService.setTranslations(LocaleService.EN_US, addNewRight_translations_en_US);

        this.right = new XoRight();

        if (this.injectedData.refRight) {
            this.right.rightName = this.injectedData.refRight.rightName;
            this.right.documentation = this.injectedData.refRight.documentation;
            this.right.parameterList = this.injectedData.refRight.parameterList ? this.injectedData.refRight.parameterList.clone() : undefined;
        }

        this.syncParameterRichlistItems(!!this.injectedData.refRight);
        this.translationHelp();
    }

    get nameHelp(): string {
        return this.translatedNameHelp;
    }

    get parameterHelp(): string {
        return this.translatedParameterHelp;
    }

    get numberOfParameters(): number {
        return this.right.parameterList ? this.right.parameterList.data.length : 0;
    }

    translationHelp() {
        const fn = (key: string, ...params: I18nParam[]) => this.injectedData.i18nService.translate(key, ...params);
        this.translatedNameHelp = fn(this.rightNameHelp, {key: '%exp1%', value: this.rightNameExp});
        this.translatedParameterHelp = fn(this.parameterHelpText);
    }

    syncParameterRichlistItems(init?: boolean) {
        this.parameterRichlistItems = [];
        if (this.right.parameterList && this.right.parameterList.data) {

            this.right.parameterList.data.forEach(p => {

                const data: XcRichListItem<ParameterRichlistItemData> = {
                    component: ParameterRichlistItemComponent,
                    removable: true,
                    data: {
                        parameter: p,
                        parameterListRef: this.right.parameterList,
                        grantMode: false,
                        validityListenerObservable: this.parameterValiditySubject.asObservable(),
                        onRemove: () => this.cdr.detectChanges()
                    }
                };
                this.parameterRichlistItems.push(data);
            });

            if (!init) {
                this.cdr.detectChanges();
            }
        }
    }

    addParameter() {
        const parameter = new XoRightParameter();
        parameter.type = RightParameterType.OPTIONS;

        if (!this.right.parameterList) {
            this.right.parameterList = new XoRightParameterArray();
        }

        const data: XcRichListItem<ParameterRichlistItemData> = {
            component: ParameterRichlistItemComponent,
            data: {
                parameter: parameter,
                parameterListRef: this.right.parameterList,
                grantMode: false,
                validityListenerObservable: this.parameterValiditySubject.asObservable(),
                onRemove: () => this.cdr.detectChanges()
            }
        };
        this.parameterRichlistItems.push(data);
        this.right.parameterList.data.push(parameter);

        this.cdr.detectChanges();
    }

    apply() {

        if (this.right.parameterList) {
            this.right.parameterList.data.forEach((p, i) => {
                if (p.type === RightParameterType.XYNA) {
                    p.value = '*';
                }
                const para = XoRight.getXoRightParameterFromString(p.value, p.type as RightParameterType);
                this.right.parameterList.data.splice(i, 1, para);
            });

            if (this.right.parameterList.data.length === 0) {
                this.right.parameterList = undefined;
            }
        }

        this.dismiss(this.right);
    }

    getItemsValidity(): boolean {
        const validitySubject = new Subject<boolean>();
        let valid = true;
        validitySubject.subscribe({ next: res => valid &&= res });
        this.parameterValiditySubject.next(validitySubject);
        return valid;
    }
}
