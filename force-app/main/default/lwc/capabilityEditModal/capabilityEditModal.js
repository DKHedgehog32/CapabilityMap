import { LightningElement, api, track } from 'lwc';
import createCapability from '@salesforce/apex/CapabilityController.createCapability';
import updateCapability from '@salesforce/apex/CapabilityController.updateCapability';
import deleteCapability from '@salesforce/apex/CapabilityController.deleteCapability';

export default class CapabilityEditModal extends LightningElement {
    @api capability;
    @api categoryId;
    @api mapId;
    @api roles = [];
    @api mode = 'create';
    
    @track name = '';
    @track size = 'TBD';
    @track phase = 'Phase 1';
    @track description = '';
    @track hoursOverride;
    @track isLoading = false;

    sizeOptions = [
        { label: 'TBD', value: 'TBD' }, { label: 'XS', value: 'XS' }, { label: 'S', value: 'S' },
        { label: 'M', value: 'M' }, { label: 'L', value: 'L' }, { label: 'XL', value: 'XL' },
        { label: 'XXL', value: 'XXL' }, { label: 'XXXL', value: 'XXXL' }
    ];

    phaseOptions = [
        { label: 'Phase 1', value: 'Phase 1' }, { label: 'Phase 2', value: 'Phase 2' },
        { label: 'Phase 3', value: 'Phase 3' }, { label: 'Phase 4', value: 'Phase 4' },
        { label: 'Future', value: 'Future' }, { label: 'Out of Scope', value: 'Out of Scope' }
    ];

    connectedCallback() {
        if (this.capability && this.mode === 'edit') {
            this.name = this.capability.Name;
            this.size = this.capability.Size__c;
            this.phase = this.capability.Phase__c;
            this.description = this.capability.Description__c || '';
            this.hoursOverride = this.capability.Hours_Override__c;
        }
    }

    get isEditMode() { return this.mode === 'edit'; }
    get modalTitle() { return this.isEditMode ? 'Edit Capability' : 'New Capability'; }

    handleNameChange(e) { this.name = e.target.value; }
    handleSizeChange(e) { this.size = e.detail.value; }
    handlePhaseChange(e) { this.phase = e.detail.value; }
    handleDescriptionChange(e) { this.description = e.target.value; }
    handleHoursChange(e) { this.hoursOverride = e.target.value ? parseInt(e.target.value, 10) : null; }
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleSave() {
        if (!this.name) return;
        this.isLoading = true;
        try {
            if (this.isEditMode) {
                await updateCapability({
                    capabilityId: this.capability.Id,
                    fields: { Name: this.name, Size__c: this.size, Phase__c: this.phase, Description__c: this.description, Hours_Override__c: this.hoursOverride }
                });
            } else {
                await createCapability({ categoryId: this.categoryId, name: this.name, size: this.size, phase: this.phase });
            }
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleDelete() {
        if (!this.capability?.Id) return;
        this.isLoading = true;
        try {
            await deleteCapability({ capabilityId: this.capability.Id });
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            this.isLoading = false;
        }
    }
}
