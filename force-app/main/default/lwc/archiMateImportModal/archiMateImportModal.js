import { LightningElement, api, track } from 'lwc';
import importArchiMateJson from '@salesforce/apex/ArchiMateImportService.importArchiMateJson';

export default class ArchiMateImportModal extends LightningElement {
    @api mapId;
    @track jsonContent = '';
    @track isLoading = false;
    @track result = null;

    handleJsonChange(e) { this.jsonContent = e.target.value; }
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleImport() {
        if (!this.jsonContent) return;
        this.isLoading = true;
        try {
            this.result = await importArchiMateJson({ mapId: this.mapId, jsonContent: this.jsonContent });
            if (this.result.success) this.dispatchEvent(new CustomEvent('imported'));
        } catch (e) { console.error(e); }
        this.isLoading = false;
    }
}
