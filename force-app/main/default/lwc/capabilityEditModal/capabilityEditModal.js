/**
 * @description    Capability Edit Modal with size grid matching mockup
 * @author         Cobra CRM B.V.
 * @version        2.3.0
 */
import { LightningElement, api, track } from 'lwc';
import createCapability from '@salesforce/apex/CapabilityController.createCapability';
import updateCapability from '@salesforce/apex/CapabilityController.updateCapability';
import deleteCapability from '@salesforce/apex/CapabilityController.deleteCapability';

// Size options with colors matching mockup
const SIZES = [
    { id: 'XS', label: 'XS', color: '#032D60', textColor: 'white' },
    { id: 'S', label: 'S', color: '#0A4D8C', textColor: 'white' },
    { id: 'M', label: 'M', color: '#0176D3', textColor: 'white' },
    { id: 'L', label: 'L', color: '#1B96FF', textColor: 'white' },
    { id: 'XL', label: 'XL', color: '#57B0FF', textColor: '#242424' },
    { id: 'XXL', label: 'XXL', color: '#90CBFF', textColor: '#242424' },
    { id: 'XXXL', label: 'XXXL', color: '#C3E1FF', textColor: '#3D3D3C' },
    { id: 'TBD', label: 'TBD', color: '#E8E8E8', textColor: '#514F4D' }
];

const PHASES = [
    { value: 'Phase 1', label: 'Phase 1' },
    { value: 'Phase 2', label: 'Phase 2' },
    { value: 'Phase 3', label: 'Phase 3' },
    { value: 'Phase 4', label: 'Phase 4' },
    { value: 'Future', label: 'Future' },
    { value: 'Out of Scope', label: 'Out of Scope' }
];

export default class CapabilityEditModal extends LightningElement {
    @api capability;
    @api categoryId;
    @api mapId;
    @api categories = [];
    @api mode = 'create';

    @track name = '';
    @track selectedCategoryId = '';
    @track selectedSize = 'TBD';
    @track phase = 'Phase 1';
    @track description = '';

    connectedCallback() {
        if (this.capability && this.mode === 'edit') {
            this.name = this.capability.Name || '';
            this.selectedCategoryId = this.capability.Capability_Category__c || '';
            this.selectedSize = this.capability.Size__c || 'TBD';
            this.phase = this.capability.Phase__c || 'Phase 1';
            this.description = this.capability.Description__c || '';
        } else {
            this.selectedCategoryId = this.categoryId || (this.categories[0]?.Id || '');
        }
    }

    get modalTitle() {
        return this.mode === 'edit' ? 'Edit Capability' : 'Add Capability';
    }

    get isEditMode() {
        return this.mode === 'edit';
    }

    get categoryOptions() {
        return this.categories.map(cat => ({
            value: cat.Id,
            label: cat.Name,
            selected: cat.Id === this.selectedCategoryId
        }));
    }

    get sizeOptions() {
        return SIZES.map(size => ({
            ...size,
            optionClass: size.id === this.selectedSize ? 'size-option selected' : 'size-option',
            style: `background-color: ${size.color}; color: ${size.textColor};`
        }));
    }

    get phaseOptions() {
        return PHASES;
    }

    // Handlers
    handleNameChange(event) {
        this.name = event.target.value;
    }

    handleCategoryChange(event) {
        this.selectedCategoryId = event.target.value;
    }

    handleSizeSelect(event) {
        this.selectedSize = event.currentTarget.dataset.size;
    }

    handlePhaseChange(event) {
        this.phase = event.target.value;
    }

    handleDescriptionChange(event) {
        this.description = event.target.value;
    }

    handleOverlayClick(event) {
        if (event.target === event.currentTarget) {
            this.handleClose();
        }
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    async handleSave() {
        if (!this.name.trim()) {
            alert('Please enter a name');
            return;
        }
        if (!this.selectedCategoryId) {
            alert('Please select a category');
            return;
        }

        try {
            if (this.mode === 'edit' && this.capability) {
                await updateCapability({
                    capabilityId: this.capability.Id,
                    name: this.name,
                    categoryId: this.selectedCategoryId,
                    size: this.selectedSize,
                    phase: this.phase,
                    description: this.description
                });
            } else {
                await createCapability({
                    categoryId: this.selectedCategoryId,
                    name: this.name,
                    size: this.selectedSize,
                    phase: this.phase,
                    description: this.description
                });
            }
            
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Error saving capability:', error);
            alert('Error saving: ' + (error.body?.message || error.message));
        }
    }

    async handleDelete() {
        if (!this.capability || !confirm('Delete this capability?')) return;
        
        try {
            await deleteCapability({ capabilityId: this.capability.Id });
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error deleting: ' + (error.body?.message || error.message));
        }
    }
}
