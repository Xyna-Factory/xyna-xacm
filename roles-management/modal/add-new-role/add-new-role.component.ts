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
import { Component, inject, ViewChild } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogComponent, XcFormDirective } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { XoRole } from '../../../xo/xo-role.model';
import { addNewRole_translations_de_DE } from './locale/add-new-role-translations.de-DE';
import { addNewRole_translations_en_US } from './locale/add-new-role-translations.en-US';


@Component({
    templateUrl: './add-new-role.component.html',
    styleUrls: ['./add-new-role.component.scss'],
    imports: [XcModule, I18nModule]
})
export class AddNewRoleComponent extends XcDialogComponent<XoRole, XoRole> {
    private readonly i18nService = inject(I18nService);


    @ViewChild(XcFormDirective, {static: false})
    modalForm: XcFormDirective;

    get invalid(): boolean {
        return this.modalForm ? this.modalForm.invalid : false;
    }

    role: XoRole = new XoRole();

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, addNewRole_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, addNewRole_translations_en_US);

        this.role.domainName0 = 'XYNA';

        if (this.injectedData) {
            this.role.roleName = this.injectedData.roleName;
            this.role.description = this.injectedData.description;
            this.role.domainName0 = this.injectedData.domainName0;
            this.role.rightList = this.injectedData.rightList.clone();
        }
    }

    apply() {
        this.dismiss(this.role);
    }
}
