/**
 * @description Modal for selecting and applying capability templates
 * @author Cobra CRM B.V.
 * @version 2.3.0
 */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveTemplates from '@salesforce/apex/CapabilityTemplateController.getActiveTemplates';
import applyTemplates from '@salesforce/apex/CapabilityTemplateController.applyTemplates';

export default class CapabilityMapTemplateModal extends LightningElement {
    @api mapId;
    @api appliedTemplates = [];
    
    @track templates = [];
    @track selectedTemplateIds = [];
    @track isLoading = false;
    @track mergeCategories = true;

    connectedCallback() {
        this.loadTemplates();
    }

    async loadTemplates() {
        this.isLoading = true;
        try {
            this.templates = await getActiveTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            this.isLoading = false;
        }
    }

    get groupedTemplates() {
        const groups = {};
        this.templates.forEach(t => {
            const cat = t.Cloud_Category__c || 'Other';
            if (!groups[cat]) groups[cat] = [];
            
            const isSelected = this.selectedTemplateIds.includes(t.Id);
            const isApplied = this.appliedTemplates.some(at => at.Capability_Template__c === t.Id);
            
            groups[cat].push({
                ...t,
                isSelected: isSelected,
                isApplied: isApplied,
                cardClass: isSelected ? 'template-card selected' : 'template-card'
            });
        });
        return Object.entries(groups).map(([category, items]) => ({ category, items }));
    }

    get hasSelectedTemplates() {
        return this.selectedTemplateIds.length > 0;
    }

    get hasNoSelectedTemplates() {
        return this.selectedTemplateIds.length === 0;
    }

    get selectedCount() {
        return this.selectedTemplateIds.length;
    }

    handleTemplateToggle(event) {
        const templateId = event.currentTarget.dataset.id;
        if (this.selectedTemplateIds.includes(templateId)) {
            this.selectedTemplateIds = this.selectedTemplateIds.filter(id => id !== templateId);
        } else {
            this.selectedTemplateIds = [...this.selectedTemplateIds, templateId];
        }
    }

    handleMergeToggle(event) {
        this.mergeCategories = event.target.checked;
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    async handleApply() {
        if (!this.hasSelectedTemplates) return;
        
        this.isLoading = true;
        try {
            const result = await applyTemplates({
                mapId: this.mapId,
                templateIds: this.selectedTemplateIds,
                mergeCategories: this.mergeCategories
            });
            
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: `Applied ${result.categoryCount} categories and ${result.capabilityCount} capabilities`,
                variant: 'success'
            }));
            
            this.dispatchEvent(new CustomEvent('templatesapplied'));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to apply templates',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}
