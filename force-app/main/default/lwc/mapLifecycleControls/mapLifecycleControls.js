import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import clearMapContents from '@salesforce/apex/MapLifecycleService.clearMapContents';
import resetToTemplates from '@salesforce/apex/MapLifecycleService.resetToTemplates';
import deleteMap from '@salesforce/apex/MapLifecycleService.deleteMap';

export default class MapLifecycleControls extends LightningElement {
    @api mapId;
    @track showConfirmModal = false;
    @track confirmAction = '';
    @track confirmMessage = '';

    handleClear() {
        this.confirmAction = 'clear';
        this.confirmMessage = 'This will delete all categories and capabilities. Are you sure?';
        this.showConfirmModal = true;
    }

    handleReset() {
        this.confirmAction = 'reset';
        this.confirmMessage = 'This will reset the map to the original templates. Are you sure?';
        this.showConfirmModal = true;
    }

    handleDelete() {
        this.confirmAction = 'delete';
        this.confirmMessage = 'This will permanently delete the capability map. Are you sure?';
        this.showConfirmModal = true;
    }

    handleCancelConfirm() { this.showConfirmModal = false; }

    async handleConfirm() {
        this.showConfirmModal = false;
        try {
            if (this.confirmAction === 'clear') {
                await clearMapContents({ mapId: this.mapId });
                this.showToast('Success', 'Map cleared', 'success');
                this.dispatchEvent(new CustomEvent('mapcleared'));
            } else if (this.confirmAction === 'reset') {
                await resetToTemplates({ mapId: this.mapId });
                this.showToast('Success', 'Map reset to templates', 'success');
                this.dispatchEvent(new CustomEvent('mapcleared'));
            } else if (this.confirmAction === 'delete') {
                await deleteMap({ mapId: this.mapId });
                this.showToast('Success', 'Map deleted', 'success');
                this.dispatchEvent(new CustomEvent('mapdeleted'));
            }
        } catch (error) {
            this.showToast('Error', error.body?.message || 'Operation failed', 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
