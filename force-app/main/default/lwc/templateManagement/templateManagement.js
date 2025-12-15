import { LightningElement, track } from 'lwc';
import getActiveTemplates from '@salesforce/apex/CapabilityTemplateController.getActiveTemplates';
import createTemplate from '@salesforce/apex/TemplateAdminService.createTemplate';

export default class TemplateManagement extends LightningElement {
    @track templates = [];
    @track showForm = false;
    @track templateName = '';
    @track cloudCategory = 'Core CRM';
    @track description = '';

    categoryOptions = [
        { label: 'Core CRM', value: 'Core CRM' }, { label: 'Marketing and Commerce', value: 'Marketing and Commerce' },
        { label: 'Industry Clouds', value: 'Industry Clouds' }, { label: 'Data and Analytics', value: 'Data and Analytics' }
    ];

    connectedCallback() { this.loadTemplates(); }
    async loadTemplates() { this.templates = await getActiveTemplates(); }

    handleAddNew() { this.showForm = true; }
    handleCancel() { this.showForm = false; }
    handleNameChange(e) { this.templateName = e.target.value; }
    handleCategoryChange(e) { this.cloudCategory = e.detail.value; }
    handleDescChange(e) { this.description = e.target.value; }

    async handleSave() {
        await createTemplate({ templateName: this.templateName, cloudCategory: this.cloudCategory, description: this.description });
        this.showForm = false; this.loadTemplates();
    }
}
