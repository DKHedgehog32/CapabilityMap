import { LightningElement, api, track } from 'lwc';
import updateHoursConfig from '@salesforce/apex/CapabilityMapController.updateHoursConfig';

export default class HoursConfigModal extends LightningElement {
    @api capabilityMap;
    @track hours = { XS: 2, S: 4, M: 8, L: 16, XL: 32, XXL: 64, XXXL: 128 };
    @track isLoading = false;

    connectedCallback() {
        if (this.capabilityMap) {
            this.hours = {
                XS: this.capabilityMap.XS_Hours__c || 2,
                S: this.capabilityMap.S_Hours__c || 4,
                M: this.capabilityMap.M_Hours__c || 8,
                L: this.capabilityMap.L_Hours__c || 16,
                XL: this.capabilityMap.XL_Hours__c || 32,
                XXL: this.capabilityMap.XXL_Hours__c || 64,
                XXXL: this.capabilityMap.XXXL_Hours__c || 128
            };
        }
    }

    handleHoursChange(event) {
        const size = event.target.dataset.size;
        this.hours = { ...this.hours, [size]: parseInt(event.target.value, 10) };
    }

    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleSave() {
        this.isLoading = true;
        try {
            const map = await updateHoursConfig({ mapId: this.capabilityMap.Id, hoursConfig: this.hours });
            this.dispatchEvent(new CustomEvent('hoursupdated', { detail: { map } }));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            this.isLoading = false;
        }
    }
}
