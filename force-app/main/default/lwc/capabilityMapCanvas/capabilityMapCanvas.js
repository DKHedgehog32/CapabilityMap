import { LightningElement, api, track } from 'lwc';

export default class CapabilityMapCanvas extends LightningElement {
    @api mapId;
    @api categories = [];
    @api capabilities = [];
    @api roles = [];
    @api roleAssignments = [];
    
    @track showCapabilityModal = false;
    @track showCategoryModal = false;
    @track selectedCapability = null;
    @track selectedCategory = null;
    @track editMode = 'create';

    get categoriesWithCapabilities() {
        return this.categories.map(cat => ({
            ...cat,
            capabilities: this.capabilities
                .filter(cap => cap.Capability_Category__c === cat.Id)
                .sort((a, b) => a.Sort_Order__c - b.Sort_Order__c)
        }));
    }

    handleAddCategory() {
        this.editMode = 'create';
        this.selectedCategory = null;
        this.showCategoryModal = true;
    }

    handleEditCategory(event) {
        const categoryId = event.currentTarget.dataset.categoryId;
        this.selectedCategory = this.categories.find(c => c.Id === categoryId);
        this.editMode = 'edit';
        this.showCategoryModal = true;
    }

    handleAddCapability(event) {
        const categoryId = event.currentTarget.dataset.categoryId;
        this.selectedCategory = this.categories.find(c => c.Id === categoryId);
        this.editMode = 'create';
        this.selectedCapability = null;
        this.showCapabilityModal = true;
    }

    handleCapabilityClick(event) {
        const capabilityId = event.detail.capabilityId;
        this.selectedCapability = this.capabilities.find(c => c.Id === capabilityId);
        this.editMode = 'edit';
        this.showCapabilityModal = true;
    }

    handleCloseCapabilityModal() {
        this.showCapabilityModal = false;
        this.selectedCapability = null;
    }

    handleCloseCategoryModal() {
        this.showCategoryModal = false;
        this.selectedCategory = null;
    }

    handleCapabilitySaved() {
        this.showCapabilityModal = false;
        this.dispatchEvent(new CustomEvent('datachanged'));
    }

    handleCategorySaved() {
        this.showCategoryModal = false;
        this.dispatchEvent(new CustomEvent('datachanged'));
    }

    handleDragStart(event) {
        event.dataTransfer.setData('capabilityId', event.target.dataset.id);
    }

    handleDragOver(event) {
        event.preventDefault();
    }

    handleDrop(event) {
        event.preventDefault();
        const capabilityId = event.dataTransfer.getData('capabilityId');
        const targetCategoryId = event.currentTarget.dataset.categoryId;
        
        this.dispatchEvent(new CustomEvent('capabilitymoved', {
            detail: { capabilityId, targetCategoryId }
        }));
    }
}
