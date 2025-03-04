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
import { Component } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcNavListItem, XcNavListOrientation } from '@zeta/xc';

import { acm_translations_de_DE } from './locale/acm-translations.de-DE';
import { acm_translations_en_US } from './locale/acm-translations.en-US';


@Component({
    selector: 'acm',
    templateUrl: './acm.component.html',
    styleUrls: ['./acm.component.scss'],
    standalone: false
})
export class AcmComponent extends RouteComponent {

    constructor(private readonly i18nService: I18nService) {
        super();
        this.i18nService.setTranslations(LocaleService.DE_DE, acm_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, acm_translations_en_US);

        this.sideListItems = [
            { name: this.i18nService.translate('xmcp.xacm.nav.users'), link: 'users' },
            { name: this.i18nService.translate('xmcp.xacm.nav.roles'), link: 'roles' },
            { name: this.i18nService.translate('xmcp.xacm.nav.rights'), link: 'rights' }
        ];

    }

    sideListItems: XcNavListItem[] = [];

    sideListOrientation = XcNavListOrientation.LEFT;
}
