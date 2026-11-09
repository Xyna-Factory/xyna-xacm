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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { dateTimeString, isString } from '@zeta/base';

import { ACMTableObject } from './acm-table-object.model';


@XoObjectClass(ACMTableObject, 'xmcp.xacm.usermanagement.datatypes', 'User')
export class XoUser extends ACMTableObject {


    @XoProperty()
    @XoUnique()
    user: string;


    @XoProperty()
    role: string;


    @XoProperty()
    locked: boolean;


    @XoProperty()
    domains: string;


    @XoProperty()
    creationDate: number;

    @XoProperty()
    @XoTransient()
    creationDateHumanReadable: string;

    @XoProperty()
    @XoTransient()
    lockedString: string;


    protected afterDecode() {
        super.afterDecode();

        if (isString(this.creationDate)) {
            this.creationDate = parseInt(this.creationDate, 10);
        }

        const t = isString(this.creationDate) ? parseInt(this.creationDate, 10) : this.creationDate;
        this.creationDateHumanReadable = dateTimeString(t);
        this.lockedString = this.locked ? 'locked' : 'unlocked';
    }

}

@XoArrayClass(XoUser)
export class XoUserArray extends XoArray<XoUser> {
}
