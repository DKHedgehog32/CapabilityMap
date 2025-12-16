/**
 * @description    Salesforce Cloud Template Selector Modal
 *                 Beautiful template picker matching the mockup design
 * 
 * @author         Cobra CRM B.V.
 * @date           2024-12-15
 * @version        2.3.0
 */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveTemplates from '@salesforce/apex/CapabilityTemplateController.getActiveTemplates';
import getTemplateWithItems from '@salesforce/apex/CapabilityTemplateController.getTemplateWithItems';
import applyTemplates from '@salesforce/apex/CapabilityTemplateController.applyTemplates';

// Template category groupings - must match Cloud_Category__c picklist values
const TEMPLATE_CATEGORIES = [
    'Core CRM',
    'Marketing and Commerce',
    'Industry Clouds',
    'Integration and Platform',
    'Data and Analytics',
    'Collaboration'
];

export default class CapabilityMapTemplateModal extends LightningElement {
    @api mapId;
    @api appliedTemplates = [];
    
    @track templates = [];
    @track selectedTemplateId = null;
    @track selectedTemplateData = null;
    @track activeCategory = 'Core CRM';
    @track isLoading = false;

    connectedCallback() {
        this.loadTemplates();
    }

    async loadTemplates() {
        this.isLoading = true;
        try {
            const result = await getActiveTemplates();
            // Calculate counts from child relationship data
            this.templates = result.map(t => ({
                ...t,
                categoryCount: t.Template_Categories__r ? t.Template_Categories__r.length : 0,
                capabilityCount: 0 // Will be loaded when template is selected
            }));
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // ============================================
    // GETTERS
    // ============================================
    get templateCategories() {
        return TEMPLATE_CATEGORIES.map(name => ({
            name,
            tabClass: name === this.activeCategory ? 'template-tab active' : 'template-tab'
        }));
    }

    get filteredTemplates() {
        return this.templates
            .filter(t => t.Cloud_Category__c === this.activeCategory)
            .map(t => ({
                ...t,
                cardClass: t.Id === this.selectedTemplateId 
                    ? 'template-card selected' 
                    : 'template-card'
            }));
    }

    get hasSelectedTemplate() {
        return this.selectedTemplateId && this.selectedTemplateData;
    }

    get selectedTemplateName() {
        const template = this.templates.find(t => t.Id === this.selectedTemplateId);
        return template ? template.Template_Name__c : '';
    }

    get previewCategories() {
        if (!this.selectedTemplateData || !this.selectedTemplateData.categories) {
            return [];
        }
        
        return this.selectedTemplateData.categories.map(cat => {
            const items = cat.items || [];
            const displayItems = items.slice(0, 4);
            const hasMore = items.length > 4;
            
            return {
                ...cat,
                items: displayItems,
                hasMore,
                moreCount: items.length - 4
            };
        });
    }

    get applyDisabled() {
        return !this.selectedTemplateId;
    }

    // ============================================
    // HANDLERS
    // ============================================
    handleCategoryClick(event) {
        this.activeCategory = event.currentTarget.dataset.category;
        this.selectedTemplateId = null;
        this.selectedTemplateData = null;
    }

    async handleTemplateSelect(event) {
        const templateId = event.currentTarget.dataset.id;
        this.selectedTemplateId = templateId;
        
        // Load template details for preview
        try {
            this.selectedTemplateData = await getTemplateWithItems({ templateId });
            
            // Update capability count on the template card
            const itemCount = this.selectedTemplateData.items ? this.selectedTemplateData.items.length : 0;
            this.templates = this.templates.map(t => {
                if (t.Id === templateId) {
                    return { ...t, capabilityCount: itemCount };
                }
                return t;
            });
        } catch (error) {
            console.error('Error loading template details:', error);
        }
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

    async handleApply() {
        if (!this.selectedTemplateId) return;
        
        // Validate mapId exists
        if (!this.mapId) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'No Capability Map selected. Please select a map first.',
                variant: 'error'
            }));
            return;
        }
        
        this.isLoading = true;
        try {
            await applyTemplates({
                mapId: this.mapId,
                templateIds: [this.selectedTemplateId],
                mergeCategories: true
            });
            
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Template applied successfully',
                variant: 'success'
            }));
            
            this.dispatchEvent(new CustomEvent('templatesapplied'));
        } catch (error) {
            console.error('Error applying template:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to apply template',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}