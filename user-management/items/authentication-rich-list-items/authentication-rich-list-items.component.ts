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
import { Component, Injector, inject } from '@angular/core';

import { XcRichListItemComponent } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Subject } from 'rxjs';

import { XoDomain } from '../../../xo/xo-domain.model';


export interface AuthenticationChangedObject {
    domain: XoDomain;
    used: boolean;
}


export interface AuthenticationRichListItemData {
    item: XoDomain;
    usedChangeSubject: Subject<AuthenticationChangedObject>;
    used: boolean;
}


@Component({
    templateUrl: './authentication-rich-list-items.component.html',
    styleUrls: ['./authentication-rich-list-items.component.scss'],
    imports: [XcModule]
})
export class AuthenticationRichListItemComponent extends XcRichListItemComponent<void, AuthenticationRichListItemData> {

    constructor() {
        const injector = inject(Injector);

        super(injector);
    }


    get name(): string {
        return this.injectedData.item.name;
    }


    get used(): boolean {
        return this.injectedData.used;
    }


    set used(value: boolean) {
        if (this.used !== value) {
            this.injectedData.used = value;
            this.injectedData.usedChangeSubject.next({
                domain: this.injectedData.item,
                used: value
            });
        }
    }
}
