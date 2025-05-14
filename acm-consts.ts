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
import { ApiService, RuntimeContext, StartOrderOptionsBuilder, StartOrderResult } from '@zeta/api';

import { Observable, Subject } from 'rxjs';

import { XoACMLocale } from './xo/xo-locale.model';
import { XoRightArray } from './xo/xo-right.model';


export const RTC = RuntimeContext.guiHttpApplication;

export const XACM_WF = {
    xmcp: {
        xacm: {
            // special endpoint to update a user - passwords are not allowed in a workflow
            usermanagement: {
                GetUsers: 'xmcp.xacm.usermanagement.GetUsers', /* TableInfo-WF */
                GetRoles: 'xmcp.xacm.usermanagement.GetRoles',
                GetDomains: 'xmcp.xacm.usermanagement.GetDomains',
                DeleteUser: 'xmcp.xacm.usermanagement.DeleteUser'
            },
            rolesmanagement: {
                GetRoles: 'xmcp.xacm.rolemanagement.GetRoles',
                GetRoleDetails: 'xmcp.xacm.rolemanagement.GetRoleDetails',
                CreateRole: 'xmcp.xacm.rolemanagement.CreateRole',
                DeleteRole: 'xmcp.xacm.rolemanagement.DeleteRole',
                ModifyRole: 'xmcp.xacm.rolemanagement.ModifyRole'
            },
            rightsmanagement: {
                QueryRightsTableInfo: 'xmcp.xacm.rightmanagement.QueryRightsTableInfo',
                CreateRight: 'xmcp.xacm.rightmanagement.CreateRight',
                DeleteRight: 'xmcp.xacm.rightmanagement.DeleteRight',
                GetAllRights: 'xmcp.xacm.rightmanagement.GetAllRights',
                ModifyRight: 'xmcp.xacm.rightmanagement.ModifyRight'
            }
        }
    }
};


export function extractError(error: any): string {
    return (typeof error === 'string') ? error : (typeof error.message === 'string') ? error.message : 'unknown error';
}

export function getAllRights(apiService: ApiService, xoLocale: XoACMLocale): Observable<XoRightArray> {

    const subject = new Subject<XoRightArray>();

    apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rightsmanagement.GetAllRights, xoLocale, XoRightArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe({
        next: (result: StartOrderResult) => {
            if (result && !result.errorMessage) {
                subject.next(result.output[0] as XoRightArray);
            } else {
                subject.error(result.errorMessage);
            }
            subject.complete();
        },
        error: error => {
            subject.error(extractError(error));
            subject.complete();
        }
    });

    return subject.asObservable();
}
