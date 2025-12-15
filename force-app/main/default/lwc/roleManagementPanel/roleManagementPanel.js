/**
 * @description Panel for managing capability roles
 * @author Cobra CRM B.V.
 * @version 2.3.0
 */
import { LightningElement, api, track } from 'lwc';
import getRolesByMap from '@salesforce/apex/CapabilityRoleController.getRolesByMap';
import createRole from '@salesforce/apex/CapabilityRoleController.createRole';
import updateRole from '@salesforce/apex/CapabilityRoleController.updateRole';
import deleteRole from '@salesforce/apex/CapabilityRoleController.deleteRole';

export default class RoleManagementPanel extends LightningElement {
    @api mapId;
    @track roles = [];
    @track showForm = false;
    @track editingRole = null;
    @track roleName = '';
    @track hourlyRate = 0;
    @track roleColor = '#0176d3';

    connectedCallback() { 
        this.loadRoles(); 
    }

    get modalTitle() {
        return this.editingRole ? 'Edit Role' : 'New Role';
    }

    get rolesWithStyle() {
        return this.roles.map(role => ({
            ...role,
            colorStyle: `background-color: ${role.Color__c || '#0176d3'}`
        }));
    }

    async loadRoles() {
        try {
            this.roles = await getRolesByMap({ mapId: this.mapId });
        } catch (e) { 
            console.error(e); 
        }
    }

    handleAddNew() { 
        this.editingRole = null; 
        this.roleName = ''; 
        this.hourlyRate = 0; 
        this.roleColor = '#0176d3'; 
        this.showForm = true; 
    }

    handleEdit(e) {
        const role = this.roles.find(r => r.Id === e.currentTarget.dataset.id);
        this.editingRole = role; 
        this.roleName = role.Name; 
        this.hourlyRate = role.Hourly_Rate__c; 
        this.roleColor = role.Color__c || '#0176d3';
        this.showForm = true;
    }

    handleCancel() { 
        this.showForm = false; 
    }

    handleNameChange(e) { 
        this.roleName = e.target.value; 
    }

    handleRateChange(e) { 
        this.hourlyRate = e.target.value; 
    }

    handleColorChange(e) { 
        this.roleColor = e.target.value; 
    }

    async handleSave() {
        try {
            if (this.editingRole) {
                await updateRole({ 
                    roleId: this.editingRole.Id, 
                    name: this.roleName, 
                    hourlyRate: this.hourlyRate, 
                    color: this.roleColor 
                });
            } else {
                await createRole({ 
                    mapId: this.mapId, 
                    name: this.roleName, 
                    hourlyRate: this.hourlyRate, 
                    color: this.roleColor 
                });
            }
            this.showForm = false; 
            this.loadRoles();
        } catch (e) { 
            console.error(e); 
        }
    }

    async handleDelete(e) {
        try {
            await deleteRole({ roleId: e.currentTarget.dataset.id }); 
            this.loadRoles();
        } catch (e) { 
            console.error(e); 
        }
    }
}
