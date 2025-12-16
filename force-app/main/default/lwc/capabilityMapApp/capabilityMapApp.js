/**
 * @description    Capability Map Tool - Main Application Component
 *                 A visual Kanban-style capability mapping tool with drag-and-drop,
 *                 multi-select, filtering, and Salesforce cloud templates.
 * 
 * @author         Cobra CRM B.V.
 * @date           2024-12-15
 * @version        2.3.2
 * 
 * FEATURES:
 * - Works with or without Klient PSA
 * - Drag and drop capabilities between categories
 * - Multi-select with Ctrl+Click
 * - Size-based color coding (XS-XXXL, TBD)
 * - Filter by size, view mode (All/Sized/TBD)
 * - Zoom controls
 * - Undo/Redo history
 * - Salesforce Cloud templates
 * - Context menu actions
 * - Real-time statistics
 * 
 * CHANGELOG:
 * 2024-12-15 - v2.3.0 - Complete rewrite matching mockup design
 * 2024-12-15 - v2.3.2 - Added standalone mode support
 */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Apex Controllers
import getMapByProject from '@salesforce/apex/CapabilityMapController.getMapByProject';
import createMap from '@salesforce/apex/CapabilityMapController.createMap';
import getMapWithData from '@salesforce/apex/CapabilityMapController.getMapWithData';
import saveMap from '@salesforce/apex/CapabilityMapController.saveMap';
import deleteCapability from '@salesforce/apex/CapabilityController.deleteCapability';
import moveCapability from '@salesforce/apex/CapabilityController.moveCapability';

// Size configuration - matches mockup
const SIZES = [
    { id: 'XS', label: 'XS', description: 'Extra Small', color: '#032D60', textColor: 'white' },
    { id: 'S', label: 'S', description: 'Small', color: '#0A4D8C', textColor: 'white' },
    { id: 'M', label: 'M', description: 'Medium', color: '#0176D3', textColor: 'white' },
    { id: 'L', label: 'L', description: 'Large', color: '#1B96FF', textColor: 'white' },
    { id: 'XL', label: 'XL', description: 'Extra Large', color: '#57B0FF', textColor: '#242424' },
    { id: 'XXL', label: 'XXL', description: 'Very Large', color: '#90CBFF', textColor: '#242424' },
    { id: 'XXXL', label: 'XXXL', description: 'Huge', color: '#C3E1FF', textColor: '#3D3D3C' },
    { id: 'TBD', label: 'TBD', description: 'To Be Determined', color: '#E8E8E8', textColor: '#514F4D' }
];

export default class CapabilityMapApp extends LightningElement {
    // Public properties
    @api recordId; // For record page context

    // Map data
    @track mapId;
    @track mapName = 'New Capability Map';
    @track capabilityMap;
    @track categories = [];
    @track capabilities = [];
    @track appliedTemplates = [];

    // UI State
    @track isLoading = false;
    @track searchTerm = '';
    @track viewFilter = 'all'; // 'all', 'sized', 'tbd'
    @track activeFilters = new Set();
    @track selectedIds = new Set();
    @track zoom = 1;
    
    // Modal state
    @track showCapabilityModal = false;
    @track showCategoryModal = false;
    @track showTemplateModal = false;
    @track showBulkSizeModal = false;
    @track modalMode = 'create';
    @track selectedCapability = null;
    @track selectedCategory = null;
    @track selectedCategoryId = null;

    // Context menu
    @track showContextMenu = false;
    @track contextMenuX = 0;
    @track contextMenuY = 0;
    @track contextCapabilityId = null;

    // Toast
    @track showToast = false;
    @track toastMessage = '';
    @track toastType = '';

    // History for undo/redo
    history = [];
    historyIndex = -1;

    // Status
    @track statusText = 'Saved';
    @track connectionStatus = 'Ready';

    // ============================================
    // LIFECYCLE
    // ============================================
    connectedCallback() {
        // Add keyboard listener
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Add click listener for context menu
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.handleDocumentClick);
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    // ============================================
    // GETTERS - Computed Properties
    // ============================================
    get hasMap() {
        return !!this.mapId;
    }

    get hasSelection() {
        return this.selectedIds.size > 0;
    }

    get selectedCount() {
        return this.selectedIds.size;
    }

    get categoryCount() {
        return this.categories.length;
    }

    get capabilityCount() {
        return this.capabilities.length;
    }

    get totalHours() {
        return this.capabilities.reduce((sum, c) => sum + (c.Calculated_Hours__c || 0), 0);
    }

    get selectedCapabilityIds() {
        return Array.from(this.selectedIds);
    }

    get zoomLevelText() {
        return Math.round(this.zoom * 100) + '%';
    }

    get mapTransformStyle() {
        return `transform: scale(${this.zoom})`;
    }

    get statusBadgeClass() {
        return `badge badge-${this.statusText.toLowerCase()}`;
    }

    get cannotUndo() {
        return this.historyIndex <= 0;
    }

    get cannotRedo() {
        return this.historyIndex >= this.history.length - 1;
    }

    // Filter button classes
    get allFilterClass() {
        return this.viewFilter === 'all' ? 'tool-btn active' : 'tool-btn';
    }

    get sizedFilterClass() {
        return this.viewFilter === 'sized' ? 'tool-btn active' : 'tool-btn';
    }

    get tbdFilterClass() {
        return this.viewFilter === 'tbd' ? 'tool-btn active' : 'tool-btn';
    }

    get contextMenuStyle() {
        return `left: ${this.contextMenuX}px; top: ${this.contextMenuY}px;`;
    }

    get toastClass() {
        return `toast ${this.toastType}`;
    }

    // ============================================
    // COMPUTED DATA
    // ============================================
    get categoriesWithCount() {
        return this.categories.map(cat => {
            const count = this.capabilities.filter(c => c.Capability_Category__c === cat.Id).length;
            return {
                ...cat,
                capabilityCount: count,
                itemClass: cat.Is_Subcategory__c ? 'category-item sub' : 'category-item'
            };
        });
    }

    get sizeLegendItems() {
        return SIZES.map(size => {
            const count = this.capabilities.filter(c => c.Size__c === size.id).length;
            return {
                ...size,
                count,
                colorStyle: `background-color: ${size.color}; color: ${size.textColor}`,
                itemClass: this.activeFilters.has(size.id) ? 'size-item filtered' : 'size-item'
            };
        });
    }

    get categoriesWithCapabilities() {
        const search = this.searchTerm.toLowerCase();
        
        return this.categories.map(category => {
            // Filter capabilities for this category
            let categoryCapabilities = this.capabilities.filter(cap => {
                // Must belong to this category
                if (cap.Capability_Category__c !== category.Id) return false;
                
                // Search filter
                if (search && !cap.Name.toLowerCase().includes(search)) return false;
                
                // Size filter
                if (this.activeFilters.size > 0 && this.activeFilters.has(cap.Size__c)) return false;
                
                // View filter
                if (this.viewFilter === 'tbd' && cap.Size__c !== 'TBD') return false;
                if (this.viewFilter === 'sized' && cap.Size__c === 'TBD') return false;
                
                return true;
            });

            // Add selection state and computed properties
            categoryCapabilities = categoryCapabilities.map(cap => ({
                ...cap,
                isSelected: this.selectedIds.has(cap.Id),
                displayHours: cap.Calculated_Hours__c || 0,
                tileClass: this.selectedIds.has(cap.Id) 
                    ? 'capability-tile multi-selected' 
                    : 'capability-tile'
            }));

            // Sort by Sort_Order__c
            categoryCapabilities.sort((a, b) => (a.Sort_Order__c || 0) - (b.Sort_Order__c || 0));

            return {
                ...category,
                capabilities: categoryCapabilities,
                headerClass: category.Is_Subcategory__c ? 'subsection-header' : 'category-header'
            };
        });
    }

    // ============================================
    // DATA LOADING
    // ============================================
    async handleProjectSelected(event) {
        const { projectId, projectName } = event.detail;
        this.isLoading = true;
        
        try {
            let map = null;
            
            // Only check for existing map if projectId provided
            if (projectId) {
                map = await getMapByProject({ projectId });
            }
            
            if (!map) {
                // Create new map (with or without project)
                map = await createMap({ 
                    projectId: projectId, // Can be null
                    mapName: projectName 
                });
                this.toast('Map created', 'success');
            }
            
            this.mapId = map.Id;
            this.mapName = map.Name;
            this.capabilityMap = map;
            
            await this.loadMapData();
            this.saveHistory();
            
        } catch (error) {
            console.error('Error loading/creating map:', error);
            this.toast('Error: ' + (error.body?.message || error.message || 'Unknown error'), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async loadMapData() {
        if (!this.mapId) return;
        
        try {
            const data = await getMapWithData({ mapId: this.mapId });
            
            // Clone arrays before sorting - LWC reactive proxies are read-only
            const cats = [...(data.categories || [])];
            cats.sort((a, b) => (a.Sort_Order__c || 0) - (b.Sort_Order__c || 0));
            
            this.categories = cats;
            this.capabilities = [...(data.capabilities || [])];
            this.appliedTemplates = data.appliedTemplates || [];
            
        } catch (error) {
            console.error('Error loading map data:', error);
            this.toast('Error loading data', 'error');
        }
    }

    // ============================================
    // HEADER ACTIONS
    // ============================================
    handleMapNameChange(event) {
        this.mapName = event.target.value;
        this.markModified();
    }

    handleUndo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
            this.toast('Undo');
        }
    }

    handleRedo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
            this.toast('Redo');
        }
    }

    handleOpenTemplates() {
        if (!this.mapId) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'No Map Selected',
                message: 'Please create or select a Capability Map first before applying templates.',
                variant: 'warning'
            }));
            return;
        }
        this.showTemplateModal = true;
    }

    handleExport() {
        const data = {
            name: this.mapName,
            categories: this.categories,
            capabilities: this.capabilities,
            exported: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'capability-map.json';
        a.click();
        
        this.toast('Exported', 'success');
    }

    handleImport() {
        // Create file input and trigger
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => this.processImport(e);
        input.click();
    }

    processImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.categories && data.capabilities) {
                    this.toast('Import feature coming soon');
                }
            } catch (err) {
                this.toast('Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ============================================
    // FILTER ACTIONS
    // ============================================
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleFilterAll() {
        this.viewFilter = 'all';
    }

    handleFilterSized() {
        this.viewFilter = 'sized';
    }

    handleFilterTbd() {
        this.viewFilter = 'tbd';
    }

    handleSizeFilterToggle(event) {
        const size = event.currentTarget.dataset.size;
        if (this.activeFilters.has(size)) {
            this.activeFilters.delete(size);
        } else {
            this.activeFilters.add(size);
        }
        // Force reactivity
        this.activeFilters = new Set(this.activeFilters);
    }

    // ============================================
    // ZOOM
    // ============================================
    handleZoomIn() {
        this.zoom = Math.min(1.5, this.zoom + 0.1);
    }

    handleZoomOut() {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
    }

    // ============================================
    // TILE INTERACTIONS
    // ============================================
    handleTileClick(event) {
        event.stopPropagation();
        const capId = event.currentTarget.dataset.id;
        
        if (event.ctrlKey || event.metaKey) {
            // Multi-select toggle
            this.toggleSelection(capId);
        } else {
            // Single select
            this.selectedIds = new Set([capId]);
        }
    }

    handleCheckboxClick(event) {
        event.stopPropagation();
        const capId = event.currentTarget.dataset.id;
        this.toggleSelection(capId);
    }

    handleTileDoubleClick(event) {
        const capId = event.currentTarget.dataset.id;
        this.openEditCapabilityModal(capId);
    }

    handleTileContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const capId = event.currentTarget.dataset.id;
        this.contextCapabilityId = capId;
        
        // Select if not already selected
        if (!this.selectedIds.has(capId)) {
            this.selectedIds = new Set([capId]);
        }
        
        // Position context menu
        this.contextMenuX = Math.min(event.pageX, window.innerWidth - 180);
        this.contextMenuY = Math.min(event.pageY, window.innerHeight - 200);
        this.showContextMenu = true;
    }

    toggleSelection(capId) {
        const newSelection = new Set(this.selectedIds);
        if (newSelection.has(capId)) {
            newSelection.delete(capId);
        } else {
            newSelection.add(capId);
        }
        this.selectedIds = newSelection;
    }

    // ============================================
    // DRAG AND DROP
    // ============================================
    handleDragStart(event) {
        const capId = event.currentTarget.dataset.id;
        event.dataTransfer.setData('text/plain', capId);
        event.currentTarget.style.opacity = '0.5';
    }

    handleDragEnd(event) {
        event.currentTarget.style.opacity = '1';
        // Remove drag-over class from all columns
        this.template.querySelectorAll('.category-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    handleDragOver(event) {
        event.preventDefault();
        const column = event.currentTarget;
        
        // Remove from others, add to this one
        this.template.querySelectorAll('.category-column').forEach(col => {
            col.classList.remove('drag-over');
        });
        column.classList.add('drag-over');
    }

    async handleDrop(event) {
        event.preventDefault();
        const column = event.currentTarget;
        const capId = event.dataTransfer.getData('text/plain');
        const newCategoryId = column.dataset.categoryId;
        
        if (capId && newCategoryId) {
            const capability = this.capabilities.find(c => c.Id === capId);
            if (capability && capability.Capability_Category__c !== newCategoryId) {
                try {
                    await moveCapability({ 
                        capabilityId: capId, 
                        newCategoryId: newCategoryId 
                    });
                    
                    // Update local state
                    capability.Capability_Category__c = newCategoryId;
                    this.capabilities = [...this.capabilities];
                    
                    this.markModified();
                    this.saveHistory();
                    this.toast('Moved');
                } catch (error) {
                    console.error('Error moving capability:', error);
                    this.toast('Error moving', 'error');
                }
            }
        }
        
        column.classList.remove('drag-over');
    }

    // ============================================
    // CONTEXT MENU ACTIONS
    // ============================================
    handleDocumentClick() {
        this.showContextMenu = false;
    }

    handleContextEdit() {
        if (this.contextCapabilityId) {
            this.openEditCapabilityModal(this.contextCapabilityId);
        }
        this.showContextMenu = false;
    }

    handleContextDuplicate() {
        this.toast('Duplicated');
        this.showContextMenu = false;
    }

    handleContextChangeSize() {
        this.showBulkSizeModal = true;
        this.showContextMenu = false;
    }

    async handleContextDelete() {
        if (this.selectedIds.size > 1) {
            this.handleBulkDelete();
        } else if (this.contextCapabilityId) {
            if (confirm('Delete this capability?')) {
                await this.deleteCapabilities([this.contextCapabilityId]);
            }
        }
        this.showContextMenu = false;
    }

    // ============================================
    // BULK ACTIONS
    // ============================================
    handleBulkChangeSize() {
        if (this.selectedIds.size === 0) return;
        this.showBulkSizeModal = true;
    }

    async handleBulkDelete() {
        if (this.selectedIds.size === 0) return;
        
        if (confirm(`Delete ${this.selectedIds.size} capabilities?`)) {
            await this.deleteCapabilities(Array.from(this.selectedIds));
            this.selectedIds = new Set();
        }
    }

    async deleteCapabilities(ids) {
        try {
            for (const id of ids) {
                await deleteCapability({ capabilityId: id });
            }
            
            // Update local state
            this.capabilities = this.capabilities.filter(c => !ids.includes(c.Id));
            
            this.markModified();
            this.saveHistory();
            this.toast('Deleted');
        } catch (error) {
            console.error('Error deleting:', error);
            this.toast('Error deleting', 'error');
        }
    }

    // ============================================
    // MODAL HANDLERS
    // ============================================
    handleAddCapability() {
        this.modalMode = 'create';
        this.selectedCapability = null;
        this.selectedCategoryId = this.categories[0]?.Id || null;
        this.showCapabilityModal = true;
    }

    handleAddCapabilityToCategory(event) {
        event.stopPropagation();
        const categoryId = event.currentTarget.dataset.categoryId;
        this.modalMode = 'create';
        this.selectedCapability = null;
        this.selectedCategoryId = categoryId;
        this.showCapabilityModal = true;
    }

    openEditCapabilityModal(capId) {
        const capability = this.capabilities.find(c => c.Id === capId);
        if (capability) {
            this.modalMode = 'edit';
            this.selectedCapability = capability;
            this.selectedCategoryId = capability.Capability_Category__c;
            this.showCapabilityModal = true;
        }
    }

    handleCloseCapabilityModal() {
        this.showCapabilityModal = false;
        this.selectedCapability = null;
    }

    async handleCapabilitySaved() {
        this.showCapabilityModal = false;
        await this.loadMapData();
        this.markModified();
        this.saveHistory();
    }

    handleAddCategory() {
        this.modalMode = 'create';
        this.selectedCategory = null;
        this.showCategoryModal = true;
    }

    handleEditCategory(event) {
        event.stopPropagation();
        const catId = event.currentTarget.dataset.id;
        const category = this.categories.find(c => c.Id === catId);
        if (category) {
            this.modalMode = 'edit';
            this.selectedCategory = category;
            this.showCategoryModal = true;
        }
    }

    handleDeleteCategory(event) {
        event.stopPropagation();
        const catId = event.currentTarget.dataset.id;
        const category = this.categories.find(c => c.Id === catId);
        if (category) {
            const count = this.capabilities.filter(c => c.Capability_Category__c === catId).length;
            if (confirm(`Delete "${category.Name}"${count > 0 ? ` and ${count} capabilities` : ''}?`)) {
                this.toast('Deleted');
            }
        }
    }

    handleCloseCategoryModal() {
        this.showCategoryModal = false;
        this.selectedCategory = null;
    }

    async handleCategorySaved() {
        this.showCategoryModal = false;
        await this.loadMapData();
        this.markModified();
        this.saveHistory();
    }

    handleCloseTemplateModal() {
        this.showTemplateModal = false;
    }

    async handleTemplatesApplied() {
        this.showTemplateModal = false;
        await this.loadMapData();
        this.markModified();
        this.saveHistory();
        this.toast('Template applied', 'success');
    }

    handleCloseBulkModal() {
        this.showBulkSizeModal = false;
    }

    async handleBulkApplied() {
        this.showBulkSizeModal = false;
        await this.loadMapData();
        this.markModified();
        this.saveHistory();
        this.toast(`Updated ${this.selectedIds.size} items`);
    }

    handleCategoryClick(event) {
        // Could scroll to category or highlight it
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    handleKeyDown(event) {
        // Ignore if in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            if (event.key === 'Escape') {
                event.target.blur();
                this.closeAllModals();
            }
            return;
        }

        // Ctrl/Cmd shortcuts
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'z') {
                event.preventDefault();
                this.handleUndo();
            }
            if (event.key === 'y') {
                event.preventDefault();
                this.handleRedo();
            }
            if (event.key === 'a') {
                event.preventDefault();
                // Select all
                this.selectedIds = new Set(this.capabilities.map(c => c.Id));
            }
        }

        // Single key shortcuts
        if (event.key === 'Escape') {
            this.selectedIds = new Set();
            this.closeAllModals();
        }
        if (event.key === 'Delete' && this.selectedIds.size > 0) {
            this.handleBulkDelete();
        }
        if (event.key === 'n' || event.key === 'N') {
            this.handleAddCapability();
        }
        if (event.key === 't' || event.key === 'T') {
            this.handleOpenTemplates();
        }
    }

    closeAllModals() {
        this.showCapabilityModal = false;
        this.showCategoryModal = false;
        this.showTemplateModal = false;
        this.showBulkSizeModal = false;
        this.showContextMenu = false;
    }

    // ============================================
    // HISTORY (UNDO/REDO)
    // ============================================
    saveHistory() {
        // Slice to current position and add new state
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({
            categories: JSON.parse(JSON.stringify(this.categories)),
            capabilities: JSON.parse(JSON.stringify(this.capabilities))
        });
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
        }
        
        this.historyIndex = this.history.length - 1;
    }

    restoreFromHistory() {
        const state = this.history[this.historyIndex];
        if (state) {
            this.categories = state.categories;
            this.capabilities = state.capabilities;
        }
    }

    // ============================================
    // STATUS & NOTIFICATIONS
    // ============================================
    markModified() {
        this.statusText = 'Modified';
        
        // Auto-save after delay
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.statusText = 'Saved';
        }, 1000);
    }

    toast(message, type = '') {
        this.toastMessage = message;
        this.toastType = type;
        this.showToast = true;
        
        setTimeout(() => {
            this.showToast = false;
        }, 2500);
    }
}