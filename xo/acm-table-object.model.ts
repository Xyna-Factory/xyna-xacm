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
import { XoObject } from '@zeta/api';


export class ACMTableObject extends XoObject {

    get hashedUniqueKey(): string {
        return this.easyHash(this.uniqueKey);
    }

    easyHash(str: string): string {
        let hash = 0, char: number, i: number;
        if (str.length === 0) {
            return 'huk' + hash;
        }

        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
             
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
             
        }
        return 'huk' + Math.abs(hash);
    }
}
