// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoUnique } from '@zeta/api';

import { ACMTableObject } from './acm-table-object.model';
import { XoRight, XoRightArray } from './xo-right.model';


@XoObjectClass(ACMTableObject, 'xmcp.xacm.rolemanagement.datatypes', 'Role')
export class XoRole extends ACMTableObject {


    @XoProperty()
    @XoUnique()
    roleName: string;


    @XoProperty()
    domainName0: string;


    @XoProperty()
    description: string;


    @XoProperty(XoRightArray)
    rightList: XoRightArray = new XoRightArray();


    isRightGranted(right: XoRight): boolean {
        const rightStr = right.getXynaFactoryImplementedString();
        const found = this.rightList.data.find(gright => rightStr === gright.getXynaFactoryImplementedString());
        return !!found;
    }

}

@XoArrayClass(XoRole)
export class XoRoleArray extends XoArray<XoRole> {
}
