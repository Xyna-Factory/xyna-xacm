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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ZetaModule } from '@zeta/zeta.module';
import { ACMApiService } from './acm-api.service';

import { ACMNavigationService } from './acm-navigation.service';
import { ACMSettingsService } from './acm-settings.service';
import { AcmComponent } from './acm.component';
import { ParameterRichlistItemComponent } from './rights-management/items/parameter-richlist-item/parameter-richlist-item.component';
import { AddNewRightComponent } from './rights-management/modal/add-new-right/add-new-right.component';
import { RightsManagementComponent } from './rights-management/rights-management.component';
import { AddNewRoleComponent } from './roles-management/modal/add-new-role/add-new-role.component';
import { EditRightComponent } from './roles-management/modal/edit-right/edit-right.component';
import { RolesManagementComponent } from './roles-management/roles-management.component';
import { AuthenticationRichListItemComponent } from './user-management/items/authentication-rich-list-items/authentication-rich-list-items.component';
import { AddNewUserComponent } from './user-management/modal/add-new-user/add-new-user.component';
import { UserManagementComponent } from './user-management/user-management.component';


@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        ZetaModule,
        AcmComponent,
        AddNewRightComponent,
        AddNewRoleComponent,
        AddNewUserComponent,
        EditRightComponent,
        RightsManagementComponent,
        RolesManagementComponent,
        UserManagementComponent,
        AuthenticationRichListItemComponent,
        ParameterRichlistItemComponent
    ],
    providers: [
        ACMApiService,
        ACMNavigationService,
        ACMSettingsService
    ]
})
export class AcmModule {}
