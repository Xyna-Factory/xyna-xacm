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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';
import { I18nParam, I18nService } from '@zeta/i18n';

import { XoRightParameterDefinitionArray } from './xo-right-parameter-definition.model';


export enum RightParameterType {
    REGEXP = 'regexp',
    OPTIONS = 'options',
    XYNA = 'xyna'
}

export class RightParameterValueError {
    valid: boolean;
    i18nParams?: I18nParam[];
    constructor(public errorMessage?: string, ...i18nParams: I18nParam[]) {
        this.valid = !errorMessage;
        this.i18nParams = i18nParams;
    }
    translate(i18n: I18nService): string {
        return i18n.translate(this.errorMessage, ...this.i18nParams);
    }
}

@XoObjectClass(null, 'xmcp.xacm.rightmanagement.datatypes', 'RightParameter')
export class XoRightParameter extends XoObject {


    @XoProperty()
    type: string;


    @XoProperty()
    value: string;


    @XoProperty(XoRightParameterDefinitionArray)
    parameterDefinitionList: XoRightParameterDefinitionArray = new XoRightParameterDefinitionArray();

    getXynaFactoryParameterDefinitionString(): string {

        if (this.type === RightParameterType.OPTIONS) {
            const arr = this.parameterDefinitionList.data.map(def => def.definition);
            return ':[' + arr.join(',') + ']';
        }
        if (this.type === RightParameterType.REGEXP) {
            return ':' + this.ensureBoundedRegExp(this.parameterDefinitionList.data[0].definition);
        }
        if (this.type === RightParameterType.XYNA) {
            return ':*';
        }

        return 'ParameterTypeNotFoundException';
    }

    getXynaFactoryParameterImplementedString(): string {
        return ':' + this.value;
    }

    isValueValid(val?: string): RightParameterValueError {
        val = val || this.value;

        if (this.type === RightParameterType.OPTIONS) {
            const group = this.parameterDefinitionList.data.map(def => def.definition);
            const found = group.find(def => def === val);
            if (found) {
                return new RightParameterValueError();
            }
            return new RightParameterValueError('VALUE MUST BE ONE OF %group%', {key: '%group%', value: group.join(', ')});
        }

        if (this.type === RightParameterType.REGEXP) {
            const def = this.parameterDefinitionList.data[0].definition;
            if (def.indexOf(':') >= 0) {
                return new RightParameterValueError('COLONS ARE NOT ALLOWED');
            }
            let str = this.ensureBoundedRegExp(def);
            const index = str.indexOf('/');
            const lastIndex = str.lastIndexOf('/');
            //const flags = str.substring(lastIndex + 1); // I believe the factory does not allow flags in regex
            str = str.substring(index + 1, lastIndex);
            const regexp = new RegExp(str);
            const res = regexp.test(val);
            return new RightParameterValueError(res ? '' : 'VALUE MUST BE VALID ACCORDING TO %regexp%', {key: '%regexp%', value: str});
        }

        if (this.type === RightParameterType.XYNA) {
            const str = '^[a-zA-Z0-9_.]*\\*?$';
            const regexp = new RegExp(str);
            const res = regexp.test(val);
            return new RightParameterValueError(res ? '' : 'VALUE DOES NOT MATCH %regexp%', {key: '%regexp%', value: '/' + str + '/'});
        }
        return new RightParameterValueError('PARAMETER TYPE WAS NOT IDENTIFIED');
    }

    isDefinitionValid(def: string): RightParameterValueError {

        if (this.type === RightParameterType.OPTIONS) {
            /*
            Input is considered valid if it is a non-empty, comma-separated list of valid options.
            An option is valid if
                - it is "*" or
                - it starts with a letter (lower- or uppercase), followed by at least one letter / number / "." / "_".
            Substrings between commas are trimmed. I.e. "  op1   ,   *   ,  abc " is valid.
            */
            const trimmedOptions = def.split(',')
                .map(slice => slice.trim());
            const regexp = /^([a-zA-Z][a-zA-Z0-9._]+|[*])$/;
            if (trimmedOptions.some(option => !regexp.test(option))) {
                return new RightParameterValueError('NOT COMMA SEPARATED LIST OF VALID OPTIONS');
            }
            if (trimmedOptions.length === 0) {
                return new RightParameterValueError('AT LEAST 1 VALID OPTION REQUIRED');
            }
            return new RightParameterValueError();
        }

        if (this.type === RightParameterType.REGEXP) {
            let okay = true;
            const index = def.indexOf('/');
            const lastIndex = def.lastIndexOf('/');
            if (index === lastIndex) {
                return new RightParameterValueError('NOT A VALID REGEXP');
            }
            // const flags = def.substring(lastIndex + 1); // I believe the factory does not allow flags in regex
            def = def.substring(index + 1, lastIndex);
            try {
                 
                new RegExp(def);
            } catch {
                okay = false;
            }
            return new RightParameterValueError(okay ? '' : 'NOT A VALID REGEXP');
        }

        if (this.type === RightParameterType.XYNA) {
            return new RightParameterValueError();
        }

        return new RightParameterValueError('PARAMETER TYPE WAS NOT IDENTIFIED');
    }

    ensureBoundedRegExp(str: string): string {
        const index = str.indexOf('/');
        if (str[index + 1] !== '^') {
            str = str.substring(0, index + 1) + '^' + str.substring(index + 1);
        }

        const lastIndex = str.lastIndexOf('/');
        if (str[lastIndex - 1] !== '$') {
            const before = str.substr(0, lastIndex);
            const after = '$/';
            str = before + after;
        }

        return str;
    }

}

@XoArrayClass(XoRightParameter)
export class XoRightParameterArray extends XoArray<XoRightParameter> {
}
