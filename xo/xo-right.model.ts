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

import { ACMTableObject } from './acm-table-object.model';
import { XoRightParameterDefinition, XoRightParameterDefinitionArray } from './xo-right-parameter-definition.model';
import { RightParameterType, XoRightParameter, XoRightParameterArray } from './xo-right-parameter.model';


@XoObjectClass(ACMTableObject, 'xmcp.xacm.rightmanagement.datatypes', 'Right')
export class XoRight extends ACMTableObject {


    @XoProperty()
    @XoUnique()
    rightName: string;


    @XoProperty()
    documentation: string;


    @XoProperty()
    parameterDescription: string;


    @XoProperty(XoRightParameterArray)
    parameterList: XoRightParameterArray;


    @XoProperty()
    originalRightName: string;


    @XoProperty()
    @XoTransient()
    parameterStr = '';

    get hasParameter(): boolean {
        return !!this.parameterList && this.parameterList.data.length > 0;
    }

    afterDecode() {
        this.updateParameterString();
    }

    updateParameterString() {
        if (this.hasParameter) {
            if (this.parameterList.data.length > 0 && this.parameterList.data[0].value) {
                this.parameterStr = this.getXynaFactoryParameterImplementedString();
            } else {
                this.parameterStr = this.getXynaFactoryParameterDefinitionString();
            }
        }
    }

    getXynaFactoryDefinitionString(): string {
        return this.rightName + this.getXynaFactoryParameterDefinitionString();
    }

    getXynaFactoryImplementedString(): string {
        return this.rightName + this.getXynaFactoryParameterImplementedString();
    }

    getXynaFactoryParameterDefinitionString(): string {
        if (this.hasParameter) {
            const arr = this.parameterList.data.map(p => p.getXynaFactoryParameterDefinitionString());
            return arr.join('');
        }
        return '';
    }

    getXynaFactoryParameterImplementedString(): string {
        if (this.hasParameter) {
            const arr = this.parameterList.data.map(p => p.getXynaFactoryParameterImplementedString());
            return arr.join('');
        }
        return '';
    }

    static withName(name: string): XoRight {
        const right = new XoRight();
        right.rightName = name;
        return right;
    }

    static getXoRightParameterFromString(para: string, type: RightParameterType): XoRightParameter {
        // - 3 Possibilities
        // 1. options! if it starts with an '[' every option is seperated by ',' and it ends with ']'
        // 2. Regex! if it starts and ends with a '/'
        // 3. (xyna/special) Regex! only a '*'

        const rightParameter = new XoRightParameter();
        const rightParameterDefinitionList = new XoRightParameterDefinitionArray();

        if (type === RightParameterType.OPTIONS) {

            rightParameter.type = RightParameterType.OPTIONS;

            const content = para.split(',');

            let i: number;
            let paraDef: XoRightParameterDefinition;
            for (i = 0; i < content.length; i++) {

                paraDef = new XoRightParameterDefinition();
                paraDef.definition = content[i].trim();
                rightParameterDefinitionList.data.push(paraDef);

            }

        } else if (type === RightParameterType.REGEXP) {

            rightParameter.type = RightParameterType.REGEXP;
            const content = para;
            const paraDef: XoRightParameterDefinition = new XoRightParameterDefinition();
            paraDef.definition = content.trim();
            rightParameterDefinitionList.data.push(paraDef);

        } else if (type === RightParameterType.XYNA) {

            rightParameter.type = RightParameterType.XYNA;
            const paraDef: XoRightParameterDefinition = new XoRightParameterDefinition();
            paraDef.definition = '*';
            rightParameterDefinitionList.data.push(paraDef);


        } else {
            console.error('"' + para + '" is no match');
        }

        rightParameter.parameterDefinitionList = rightParameterDefinitionList;

        return rightParameter;
    }

    static getParameterListRegExp(right: XoRight): string {
        let regExpStr = '';

        let parameter: XoRightParameter;
        let i: number;

        if (!right.parameterList) {
            return '';
        }

        for (i = 0; i < right.parameterList.data.length; i++) {
            parameter = right.parameterList.data[i];

            if (parameter.type === RightParameterType.OPTIONS) {

                regExpStr += '(';

                let def: XoRightParameterDefinition;
                let j: number;
                const end = parameter.parameterDefinitionList.data.length - 1;
                for (j = 0; j <= end; j++) {
                    def = parameter.parameterDefinitionList.data[j];

                    if (def.definition === '*') {
                        regExpStr += ':\\' + def.definition;
                    } else {
                        regExpStr += ':' + def.definition;
                    }

                    if (j < end) {
                        regExpStr += '|';
                    }
                }

                regExpStr += ')';

            } else if (parameter.type === RightParameterType.REGEXP) {

                // const def = '\\/' + parameter.parameterDefinitionList.data[0].definition + '\\/';
                const def = parameter.parameterDefinitionList.data[0].definition;
                regExpStr += '(:' + def.substring(1, def.length - 1) + ')';

            } else if (parameter.type === RightParameterType.XYNA) {
                regExpStr += '(:[a-zA-Z0-9_.]*\\*?)';
            }
        }

        return regExpStr + '';
    }

}


@XoArrayClass(XoRight)
export class XoRightArray extends XoArray<XoRight> {
}
