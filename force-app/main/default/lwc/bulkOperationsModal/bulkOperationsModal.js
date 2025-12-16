/**
 * ============================================================
 * bulkOperationsModal.js
 * ============================================================
 * @description    Modal for bulk operations on capabilities
 *                 Allows changing size/phase for multiple items
 * 
 * @author         Cobra CRM B.V.
 * @version        2.3.5
 * 
 * CHANGELOG:
 * ─────────────────────────────────────────────────────────────
 * v2.3.5  2024-12-15  Fixed bulkUpdateCapabilities call to use fields map
 * v2.3.0  2024-12-15  Initial version
 * ============================================================
 */
import { LightningElement, api, track } from 'lwc';
import bulkUpdateCapabilities from '@salesforce/apex/CapabilityController.bulkUpdateCapabilities';

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

export default class BulkOperationsModal extends LightningElement {
    @api selectedCapabilityIds = [];
    @track selectedSize = '';

    get itemCount() {
        return this.selectedCapabilityIds.length;
    }

    get sizeOptions() {
        return SIZES.map(size => ({
            ...size,
            optionClass: size.id === this.selectedSize ? 'size-option selected' : 'size-option',
            style: `background-color: ${size.color}; color: ${size.textColor};`
        }));
    }

    handleSizeSelect(event) {
        this.selectedSize = event.currentTarget.dataset.size;
    }
    
    handleClose() { 
        this.dispatchEvent(new CustomEvent('close')); 
    }

    async handleApply() {
        // Validate
        if (!this.selectedSize) {
            alert('Please select a size');
            return;
        }
        if (!this.selectedCapabilityIds || this.selectedCapabilityIds.length === 0) {
            alert('No capabilities selected');
            return;
        }

        try {
            // Build the fields map for Apex
            const fields = {
                'Size__c': this.selectedSize
            };
            
            await bulkUpdateCapabilities({
                capabilityIds: this.selectedCapabilityIds,
                fields: fields
            });
            
            this.dispatchEvent(new CustomEvent('applied'));
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + (error.body?.message || error.message));
        }
    }
}