import { LightningElement, api, track } from 'lwc';
import bulkUpdateCapabilities from '@salesforce/apex/CapabilityController.bulkUpdateCapabilities';

export default class BulkOperationsModal extends LightningElement {
    @api selectedCapabilityIds = [];
    @track size = '';
    @track phase = '';
    sizeOptions = [{ label: 'No Change', value: '' },{ label: 'XS', value: 'XS' },{ label: 'S', value: 'S' },{ label: 'M', value: 'M' },{ label: 'L', value: 'L' },{ label: 'XL', value: 'XL' },{ label: 'XXL', value: 'XXL' },{ label: 'XXXL', value: 'XXXL' }];
    phaseOptions = [{ label: 'No Change', value: '' },{ label: 'Phase 1', value: 'Phase 1' },{ label: 'Phase 2', value: 'Phase 2' },{ label: 'Phase 3', value: 'Phase 3' },{ label: 'Phase 4', value: 'Phase 4' },{ label: 'Future', value: 'Future' },{ label: 'Out of Scope', value: 'Out of Scope' }];

    get selectedCount() { return this.selectedCapabilityIds.length; }
    handleSizeChange(e) { this.size = e.detail.value; }
    handlePhaseChange(e) { this.phase = e.detail.value; }
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleApply() {
        const fields = {};
        if (this.size) fields.Size__c = this.size;
        if (this.phase) fields.Phase__c = this.phase;
        try {
            await bulkUpdateCapabilities({ capabilityIds: this.selectedCapabilityIds, fields });
            this.dispatchEvent(new CustomEvent('applied'));
        } catch (e) { console.error(e); }
    }
}
