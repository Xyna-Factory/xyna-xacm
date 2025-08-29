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
import { RouterModule, Routes } from '@angular/router';

import { RedirectComponent, redirectGuardCanActivate, redirectGuardCanDeactivate } from '@zeta/nav';
import { rightGuardCanActivate } from '@zeta/nav/right.guard';

import { AcmComponent } from './acm.component';
import { RIGHT_ACM } from './const';
import { RightsManagementComponent } from './rights-management/rights-management.component';
import { RolesManagementComponent } from './roles-management/roles-management.component';
import { UserManagementComponent } from './user-management/user-management.component';


const root = 'acm';

export const AcmRoutes: Routes = [
    {
        path: '',
        redirectTo: root,
        pathMatch: 'full'
    }, {
        path: root,
        component: AcmComponent,
        canActivate: [rightGuardCanActivate],
        data: { right: RIGHT_ACM, reuse: root, title: root },
        children: [
            {
                path: '',
                component: RedirectComponent,
                canActivate: [redirectGuardCanActivate],
                data: { reuse: root, redirectKey: root, redirectDefault: 'users' } // important that the RedirectComponent uses the reuse-strategy as well ( => { reuse : uniqueKey })
            },
            {
                path: 'users',
                redirectTo: 'users/',
                pathMatch: 'full'
            },
            {
                path: 'users/:uniqueKey',
                component: UserManagementComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: 'users', redirectKey: root, title: 'Users' }
            },
            {
                path: 'roles',
                redirectTo: 'roles/',
                pathMatch: 'full'
            },
            {
                path: 'roles/:uniqueKey',
                component: RolesManagementComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: 'roles', redirectKey: root, title: 'Roles' }
            },
            {
                path: 'rights',
                redirectTo: 'rights/',
                pathMatch: 'full'
            },
            {
                path: 'rights/:uniqueKey',
                component: RightsManagementComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: 'rights', redirectKey: root, title: 'Rights' }
            }
        ]
    }
];

export const AcmRoutingModules = [
    RouterModule.forChild(AcmRoutes)
];

export const AcmRoutingProviders = [
];
