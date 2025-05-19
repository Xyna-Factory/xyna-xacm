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
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';

import { I18nService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcAutocompleteDataWrapper, XcFormInputComponent, XcOptionItem, XcOptionItemString, XcRichListItemComponent } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Observable, Subject, Subscription } from 'rxjs';

import { RightParameterType, RightParameterValueError, XoRightParameter, XoRightParameterArray } from '../../../xo/xo-right-parameter.model';


function ParameterValueValidator(errorMessage: string, parameterDataGetter: () => ParameterRichlistItemData, i18n: I18nService): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const para = parameterDataGetter().parameter;
        const grantMode = parameterDataGetter().grantMode;
        const value = (<string>control.value);
        let allowed: RightParameterValueError;

        if (grantMode) {
            allowed = para.isValueValid(value);
        } else {
            allowed = para.isDefinitionValid(value);
        }

        return !allowed.valid ? { 'message': { value: control.value, message: allowed.translate(i18n) } } : null;
    };
}

export interface ParameterRichlistItemData {
    parameter: XoRightParameter;
    parameterListRef: XoRightParameterArray;
    grantMode?: boolean;
    readonly?: boolean;
    onRemove?: () => void;
    /**
     * the observable, which triggers everytime the parent component (which displays the richlist) wants to know the validy
     * - it delivers the subject, which should be triggered if a Variant Object or an Attribute is invalid
     */
    validityListenerObservable?: Observable<Subject<boolean>>;
    // i18nService: I18nService;
}

@Component({
    templateUrl: './parameter-richlist-item.component.html',
    styleUrls: ['./parameter-richlist-item.component.scss'],
    imports: [XcModule, I18nModule]
})
export class ParameterRichlistItemComponent extends XcRichListItemComponent<void, ParameterRichlistItemData> implements OnDestroy {

    @ViewChild('parameterValue', { read: XcFormInputComponent, static: false })
    set parameterValueInput(value: XcFormInputComponent) {
        if (value) {
            const dataGetter = () => this.injectedData;
            const valFunc = ParameterValueValidator('PARAMETER VALUE IS NOT CORRECT', dataGetter, this.i18n);
            value.addValidator(valFunc);
        }
    }

    get grantMode(): boolean {
        return this.injectedData.grantMode;
    }

    get xynaTypeSelected(): boolean {
        return this.injectedData.parameter.type === RightParameterType.XYNA;
    }

    get optionsTypeSelected(): boolean {
        return this.injectedData.parameter.type === RightParameterType.OPTIONS;
    }

    parameterTypeDataWrapper: XcAutocompleteDataWrapper;

    optionsDataWrapper: XcAutocompleteDataWrapper;

    private readonly validitySubscription: Subscription;

    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.parameterTypeDataWrapper = new XcAutocompleteDataWrapper(
            () => this.injectedData.parameter.type,
            value => this.injectedData.parameter.type = value,
            [
                { name: 'Options', value: RightParameterType.OPTIONS },
                { name: 'RegExp', value: RightParameterType.REGEXP },
                { name: 'Xyna', value: RightParameterType.XYNA }
            ]
        );

        if (this.injectedData.parameter && this.injectedData.parameter.parameterDefinitionList) {

            if (this.injectedData.parameter.type === RightParameterType.OPTIONS) {
                if (this.injectedData.grantMode) {
                    this.optionsDataWrapper = new XcAutocompleteDataWrapper(
                        () => this.injectedData.parameter.value,
                        (value: string) => this.injectedData.parameter.value = value,
                        this.injectedData.parameter.parameterDefinitionList.data.map<XcOptionItem>(def => XcOptionItemString(def.definition))
                    );
                } else {
                    const arr = this.injectedData.parameter.parameterDefinitionList.data.map(def => def.definition);
                    this.injectedData.parameter.value = arr.join(', ');
                }
            }

            if (this.injectedData.parameter.type === RightParameterType.REGEXP) {
                if (this.injectedData.grantMode) {
                    //
                } else {
                    this.injectedData.parameter.value = this.injectedData.parameter.parameterDefinitionList.data[0].definition;
                }
            }

        }

        if (this.injectedData.validityListenerObservable) {
            this.validitySubscription = this.injectedData.validityListenerObservable.subscribe({ next: subj => subj.next(this.isValid())});
        }
    }

    ngOnDestroy() {
        if (this.validitySubscription) {
            this.validitySubscription.unsubscribe();
        }
    }

    isValid(): boolean {
        const para = this.injectedData.parameter;
        return this.grantMode ? para.isValueValid().valid : para.isDefinitionValid(para.value).valid;
    }

    delete() {
        const index = this.injectedData.parameterListRef.data.indexOf(this.injectedData.parameter);
        if (index >= 0) {
            this.injectedData.parameterListRef.data.splice(index, 1);
        }
        this.dismiss();
        if (this.injectedData.onRemove) {
            this.injectedData.onRemove();
        }
    }

}
