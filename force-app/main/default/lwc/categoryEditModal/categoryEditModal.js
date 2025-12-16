/**
 * @description    Category Edit Modal matching mockup style
 * @author         Cobra CRM B.V.
 * @version        2.3.0
 */
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

    connectedCallback() {
        if (this.category && this.mode === 'edit') {
            this.name = this.category.Name || '';
            this.isSubcategory = this.category.Is_Subcategory__c || false;
        }
    }

    get modalTitle() {
        return this.mode === 'edit' ? 'Edit Category' : 'Add Category';
    }

    get isEditMode() {
        return this.mode === 'edit';
    }

    handleNameChange(event) { this.name = event.target.value; }
    handleSubcategoryChange(event) { this.isSubcategory = event.target.checked; }

    handleOverlayClick(event) {
        if (event.target === event.currentTarget) this.handleClose();
    }
    stopPropagation(event) { event.stopPropagation(); }
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleSave() {
        if (!this.name.trim()) {
            alert('Please enter a name');
            return;
        }

        try {
            if (this.mode === 'edit' && this.category) {
                await updateCategory({
                    categoryId: this.category.Id,
                    name: this.name,
                    isSubcategory: this.isSubcategory
                });
            } else {
                await createCategory({
                    mapId: this.mapId,
                    name: this.name,
                    isSubcategory: this.isSubcategory
                });
            }
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error: ' + (error.body?.message || error.message));
        }
    }

    async handleDelete() {
        if (!this.category || !confirm('Delete this category and all its capabilities?')) return;
        
        try {
            await deleteCategory({ categoryId: this.category.Id });
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }
}
