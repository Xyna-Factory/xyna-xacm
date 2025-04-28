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
import { Component, Injector } from '@angular/core';

import { StartOrderOptionsBuilder, StartOrderResult } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService, XcLocalTableDataSource, XDSIconName } from '@zeta/xc';

import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, filter, map } from 'rxjs/operators';

import { ACMApiService } from '../acm-api.service';
import { extractError, getAllRights, RTC, XACM_WF } from '../acm-consts';
import { ACMRouteComponent } from '../acm-route-component.class';
import { ACMSettingsService } from '../acm-settings.service';
import { XoRight, XoRightArray } from '../xo/xo-right.model';
import { XoRoleName } from '../xo/xo-role-name.model';
import { XoRoleTableEntry, XoRoleTableEntryArray } from '../xo/xo-role-table-entry.model';
import { XoRole } from '../xo/xo-role.model';
import { roles_translations_de_DE } from './locale/roles-translations.de-DE';
import { roles_translations_en_US } from './locale/roles-translations.en-US';
import { AddNewRoleComponent } from './modal/add-new-role/add-new-role.component';
import { EditRightComponent, EditRightComponentData } from './modal/edit-right/edit-right.component';


@Component({
    selector: 'roles-management',
    templateUrl: './roles-management.component.html',
    styleUrls: ['./roles-management.component.scss'],
    standalone: false
})
export class RolesManagementComponent extends ACMRouteComponent<XoRoleTableEntry> {

    rightsLocalTableDataSource: XcLocalTableDataSource<XoRight>;
    selectedRight: XoRight;

    allRights: XoRightArray;

    loading: boolean;

    role: XoRole;

    constructor(
        injector: Injector,
        apiService: ACMApiService,
        i18nService: I18nService,
        dialogService: XcDialogService,
        settings: ACMSettingsService
    ) {
        super(injector, apiService, i18nService, dialogService, settings);

        this.currentObjectChange.subscribe(roleTableEntry => {
            this.rightsLocalTableDataSource.resetFilters();
            if (roleTableEntry) {
                this.getDetailsAboutTableEntry(roleTableEntry).subscribe({
                    next: (role: XoRole) => {
                        if (role) {
                            this.role = role;
                            this.syncRightsTable();
                        }
                    }, 
                    error: error => this.dialogService.error(error)
                });
            }
        });

        this.rightsLocalTableDataSource = new XcLocalTableDataSource<XoRight>(this.i18nService);
        this.rightsLocalTableDataSource.localTableData = {
            rows: [],
            columns: [
                { path: 'rightName', name: 'Right' },
                { path: 'parameterStr', name: 'Parameter Implementation' } // parameterStr should be a transient property of XoRight
            ]
        };

        this.rightsLocalTableDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        this.rightsLocalTableDataSource.selectionModel.selectionChange.subscribe(model => this.selectedRight = model.selection[0]);

        this.rightsLocalTableDataSource.actionElements = [
            {
                iconName: XDSIconName.EDIT,
                tooltip: this.i18nService.translate('xmcp.xacm.roles.edit'),
                onAction: row => this.editRight(row)
            },
            {
                iconName: XDSIconName.DELETE,
                tooltip: this.i18nService.translate('xmcp.xacm.roles.revoke'),
                onAction: row => this.revokeRight(row)
            }
        ];

        this.i18nService.setTranslations(LocaleService.DE_DE, roles_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, roles_translations_en_US);
    }

    protected getTableWorkflow(): string {
        return XACM_WF.xmcp.xacm.rolesmanagement.GetRoles;
    }

    beforeInitTableRefresh() {
        super.beforeInitTableRefresh();
        this.tableDataSource.output = XoRoleTableEntryArray;
    }

    create(ref?: XoRole) {
        this.dialogService.custom<XoRole, XoRole>(AddNewRoleComponent, ref).afterDismissResult().subscribe(
            (role: XoRole) => {
                if (role) {
                    this.apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rolesmanagement.CreateRole, role, XoRole, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe({
                        next: (result: StartOrderResult) => {
                            if (result && !result.errorMessage) {
                                this.refresh();
                            } else {
                                this.dialogService.error(result.errorMessage);
                            }
                        },
                        error: error => this.dialogService.error(extractError(error))
                    });
                }
            }
        );
    }

    copy(roleTableEntry: XoRoleTableEntry) {
        if (roleTableEntry) {
            this.getDetailsAboutTableEntry(roleTableEntry).subscribe({
                next: (role: XoRole) => {
                    if (role) {
                        this.create(role);
                    }
                }, 
                error: error => this.dialogService.error(error)
            });
        }
    }

    delete(tableObject?: XoRoleTableEntry) {
        const role: XoRole = new XoRole();
        role.roleName = tableObject.role || this.currentObject.role;
        role.domainName0 = tableObject.domain || this.currentObject.domain;
        role.description = tableObject.documentation || this.currentObject?.documentation;

        const questionTitle = this.i18nService.translate('xmcp.xacm.roles.question');
        const question = this.i18nService.translate('xmcp.xacm.roles.delete', { key: '%name%', value: role.roleName });

        const sendRequest = () => {
            if (role instanceof XoRole) {
                this.apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rolesmanagement.DeleteRole, role, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe({
                    next: result => {
                        if (result && !result.errorMessage) {
                            this.currentObject = null;
                            this.role = null;
                            this.refresh();
                        } else {
                            this.dialogService.error(result.errorMessage);
                        }
                    },
                    error: error => this.dialogService.error(extractError(error))
                });
            }
        };

        this.dialogService.confirm(questionTitle, question).afterDismissResult().subscribe(res => {
            if (res) {
                sendRequest();
            }
        });
    }

    clearFilters() {
        this.tableDataSource.resetFilters();
    }

    updateRights() {
        getAllRights(this.apiService, this.apiService.xoLocale).subscribe({
            next: (rights: XoRightArray) => {
                if (rights) {
                    this.allRights = rights;
                    this.editRight(null);
                }
            }, 
            error: error => this.dialogService.error(error)
        });
    }

    getDetailsAboutTableEntry(roleTableEntry: XoRoleTableEntry): Observable<XoRole> {
        const roleName: XoRoleName = new XoRoleName();
        roleName.roleName = roleTableEntry.role;

        if (roleName.roleName) {
            return this.apiService
                .startOrder(RTC, XACM_WF.xmcp.xacm.rolesmanagement.GetRoleDetails, [roleName, this.apiService.xoLocale], XoRole, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
                    filter(result => {
                        if (result.errorMessage) {
                            // if the error is due to a missing right ...
                            const missingRight = /Right\s(.*)\sis\snot\sknown\sto\sthe\sfactory/.exec(result.errorMessage)[1];
                            if (missingRight) {
                                this.dialogService.confirm(
                                    this.i18nService.translate('xmcp.xacm.roles.unknown-right-title'),
                                    this.i18nService.translate('xmcp.xacm.roles.unknown-right-body', { key: '%right%', value: missingRight })
                                ).afterDismissResult().pipe(filter(answer => answer)).subscribe(answer => {
                                    // ... create missing right
                                    const right = XoRight.withName(missingRight);
                                    this.apiService.createRight(right).subscribe();
                                });
                            } else {
                                // ... else show general error
                                this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                            }
                            return false;
                        }
                        return true;
                    }),
                    filter(result => result && !result.errorMessage),
                    map(result => result.output[0] as XoRole),
                    catchError(error => {
                        this.dialogService.error(extractError(error));
                        return throwError(error);
                    })
                );
        }

        return of(null);
    }

    private syncRightsTable(selectCurrent = true) {
        // clear() destroys the reference, so it will be copied
        const currentTemp = this.selectedRight;
        // clears all rows
        this.rightsLocalTableDataSource.clear();
        // restores the reference
        this.selectedRight = currentTemp;

        // fills the local table
        if (this.role) {
            let right: XoRight;
            for (right of this.role.rightList.data) {
                right.afterDecode();
                this.rightsLocalTableDataSource.add(right);
            }
            // selects the current object
            if (selectCurrent && this.selectedRight) {
                this.rightsLocalTableDataSource.selectionModel.select(this.selectedRight);
            }
        }
    }

    save() {
        const clone = this.role.clone();
        this.apiService.startOrder(RTC, XACM_WF.xmcp.xacm.rolesmanagement.ModifyRole, clone, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe({
            next: (result: StartOrderResult) => {
                if (result && !result.errorMessage) {
                    this.refresh();
                    this.closeDetails();
                } else {
                    this.dialogService.error(result.errorMessage);
                }
            },
            error: error => this.dialogService.error(extractError(error))
        });
    }

    editRight(refRight: XoRight) {
        const data: EditRightComponentData = {
            allRights: this.allRights,
            right: refRight ? refRight.clone() : null,
            i18n: this.i18nService,
            selectedRole: this.role
        };

        this.dialogService.custom<void, EditRightComponentData>(EditRightComponent, data)
            .afterDismissResult().subscribe(() => this.syncRightsTable());
    }

    revokeRight(refRight?: XoRight) {
        const right = refRight || this.selectedRight;
        const i = this.role.rightList.data.indexOf(right);

        if (i >= 0) {
            this.role.rightList.data.splice(i, 1);
            this.selectedRight = right === this.selectedRight ? null : this.selectedRight;
            this.syncRightsTable();
        }

    }

    revokeSelectedRights() {
        const selection = this.rightsLocalTableDataSource.selectionModel.selection;

        selection.forEach(right => {
            const i = this.role.rightList.data.indexOf(right);
            if (i >= 0) {
                this.role.rightList.data.splice(i, 1);
            }
        });

        this.syncRightsTable();

    }

    closeDetails() {
        super.closeDetails();
        this.role = null;
    }
}
