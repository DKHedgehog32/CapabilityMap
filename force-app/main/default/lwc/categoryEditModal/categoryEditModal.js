import { LightningElement, api, track } from 'lwc';
import createCategory from '@salesforce/apex/CapabilityCategoryController.createCategory';
import updateCategory from '@salesforce/apex/CapabilityCategoryController.updateCategory';
import deleteCategory from '@salesforce/apex/CapabilityCategoryController.deleteCategory';

export default class CategoryEditModal extends LightningElement {
    @api category;
    @api mapId;
    @api mode = 'create';
    @track name = '';
    @track isSubcategory = false;
    @track isLoading = false;

    connectedCallback() {
        if (this.category && this.mode === 'edit') {
            this.name = this.category.Name;
            this.isSubcategory = this.category.Is_Subcategory__c;
        }
    }

    get isEditMode() { return this.mode === 'edit'; }
    get modalTitle() { return this.isEditMode ? 'Edit Category' : 'New Category'; }

    handleNameChange(e) { this.name = e.target.value; }
    handleSubcategoryChange(e) { this.isSubcategory = e.target.checked; }
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleSave() {
        if (!this.name) return;
        this.isLoading = true;
        try {
            if (this.isEditMode) {
                await updateCategory({ categoryId: this.category.Id, name: this.name, isSubcategory: this.isSubcategory });
            } else {
                await createCategory({ mapId: this.mapId, name: this.name, isSubcategory: this.isSubcategory });
            }
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleDelete() {
        if (!this.category?.Id) return;
        this.isLoading = true;
        try {
            await deleteCategory({ categoryId: this.category.Id });
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            this.isLoading = false;
        }
    }
}
