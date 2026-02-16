import { NgClass } from '@angular/common';
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
import { XcAutocompleteDataWrapper, XcDialogComponent, XcFormDirective, XcOptionItem, XcOptionItemString, XcRichListItem } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Observable, Subject, Subscription } from 'rxjs';

import { XoCreateUserRequest } from '../../../xo/xo-create-user-request.model';
import { XoDomainArray } from '../../../xo/xo-domain.model';
import { XoRoleNameArray } from '../../../xo/xo-role-name.model';
import { XoUser } from '../../../xo/xo-user.model';
import { AuthenticationChangedObject, AuthenticationRichListItemComponent, AuthenticationRichListItemData } from '../../items/authentication-rich-list-items/authentication-rich-list-items.component';
import { addNewUser_translations_de_DE } from './locale/add-new-user-translations.de-DE';
import { addNewUser_translations_en_US } from './locale/add-new-user-translations.en-US';


export interface AddNewUserComponentData {
    roles: Observable<XoRoleNameArray>;
    domains: Observable<XoDomainArray>;
    refUser?: XoUser;
}


@Component({
    templateUrl: './add-new-user.component.html',
    styleUrls: ['./add-new-user.component.scss'],
    imports: [XcModule, I18nModule, NgClass]
})
export class AddNewUserComponent extends XcDialogComponent<XoCreateUserRequest, AddNewUserComponentData> {
    private readonly i18n = inject(I18nService);


    @ViewChild(XcFormDirective, { static: false })
    modalForm: XcFormDirective;

    user = new XoCreateUserRequest();
    roleDataWrapper: XcAutocompleteDataWrapper;
    authenticationRichListItems: XcRichListItem[];

    usedChangeSubject = new Subject<AuthenticationChangedObject>();
    subscriptionOfUsedChangeSubject: Subscription;

    pw = '';
    pwr = '';

    get passwordsMatch(): boolean {
        // if 1st pw input field is empty - password will be ignored and do not need to match
        return !this.pw || this.pw === this.pwr;
    }

    get passwordMatchClass(): string {
        return this.passwordsMatch ? 'passwords-match' : 'passwords-mismatch';
    }

    constructor() {
        super();

        this.i18n.setTranslations(LocaleService.DE_DE, addNewUser_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewUser_translations_en_US);

        this.roleDataWrapper = new XcAutocompleteDataWrapper(
            () => this.user.role,
            value => this.user.role = value
        );

        if (this.injectedData.refUser) {
            this.user.username = this.injectedData.refUser.user;
            this.user.role = this.injectedData.refUser.role;
            this.user.domains = this.convertDomainStringToArray(this.injectedData.refUser.domains);
        }

        this.injectedData.roles.subscribe(options => {
            this.roleDataWrapper.values = options.data.map<XcOptionItem>(r => XcOptionItemString(r.roleName));
        });

        this.subscriptionOfUsedChangeSubject = this.usedChangeSubject.subscribe(obj => this.changeUsageOfDomain(obj.used, obj.domain.name));

        this.syncAuthenticationRichListItems();
    }

    isInvalid(): boolean {
        return this.modalForm ? this.modalForm.invalid : false;
    }

    cancel() {
        if (this.subscriptionOfUsedChangeSubject) {
            this.subscriptionOfUsedChangeSubject.unsubscribe();
        }
        this.dismiss();
    }

    apply() {
        if (this.subscriptionOfUsedChangeSubject) {
            this.subscriptionOfUsedChangeSubject.unsubscribe();
        }
        this.user.password = this.pw;
        this.dismiss(this.user);
    }

    private syncAuthenticationRichListItems() {

        this.authenticationRichListItems = [];
        this.injectedData.domains.subscribe(xarr => {
            if (xarr) {
                xarr.data.forEach(domain => {

                    const data: XcRichListItem<AuthenticationRichListItemData> = {
                        component: AuthenticationRichListItemComponent,
                        data: {
                            item: domain,
                            used: this.isDomainUsed(domain.name),
                            usedChangeSubject: this.usedChangeSubject
                        },
                        selectable: false
                    };
                    this.authenticationRichListItems.push(data);
                });
            }
        });
    }

    private isDomainUsed(name: string): boolean {
        return !!this.user.domains.find(d => d === name);
    }

    private convertDomainStringToArray(str: string): string[] {
        return str.split(',').map<string>(s => s.trim()).filter(s => s);
    }

    private changeUsageOfDomain(wanted: boolean, domain: string) {
        const alreadyUsed = this.isDomainUsed(domain);
        if (wanted) {
            if (!alreadyUsed) {
                // add
                this.user.domains.push(domain);
            }
        } else if (alreadyUsed) {
            // remove
            this.user.domains = this.user.domains.filter(str => str !== domain);
        }
    }
}
