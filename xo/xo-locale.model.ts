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
/**
 * base.locale.Locale will be needed in more projects than acm
 * and I don't want name conflict because of auto importer feature of vscode
 */

import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoUnique } from '@zeta/api';


@XoObjectClass(null, 'base.locale', 'Locale')
export class XoACMLocale extends XoObject {


    @XoProperty()
    @XoUnique()
    language: string;


    @XoProperty()
    country: string;


    @XoProperty()
    variant: string;


}

@XoArrayClass(XoACMLocale)
export class XoACMLocaleArray extends XoArray<XoACMLocale> {
}
