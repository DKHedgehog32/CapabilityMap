/**
 * @description    Capability Map Tool - Main Application Component
 *                 A visual Kanban-style capability mapping tool with drag-and-drop,
 *                 multi-select, filtering, and Salesforce cloud templates.
 * 
 * @author         Cobra CRM B.V.
 * @date           2024-12-15
 * @version        2.4.0
 * 
 * FEATURES:
 * - Works with or without Klient PSA
 * - Drag and drop capabilities between categories
 * - Multi-select with Ctrl+Click
 * - Selectable color themes with gradient sizing
 * - Filter by size, view mode (All/Sized/TBD)
 * - Zoom controls
 * - Undo/Redo history
 * - Salesforce Cloud templates
 * - Context menu actions
 * - Real-time statistics
 * 
 * CHANGELOG:
 * 2024-12-16 - v2.4.0 - Added selectable color themes
 * 2024-12-15 - v2.3.0 - Complete rewrite matching mockup design
 * 2024-12-15 - v2.3.2 - Added standalone mode support
 */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { generateColorShades, getTextColor } from './colorThemes';

// Apex Controllers
import getMapByProject from '@salesforce/apex/CapabilityMapController.getMapByProject';
import createMap from '@salesforce/apex/CapabilityMapController.createMap';
import getMapWithData from '@salesforce/apex/CapabilityMapController.getMapWithData';
import saveMap from '@salesforce/apex/CapabilityMapController.saveMap';
import getMyFavorites from '@salesforce/apex/CapabilityMapController.getMyFavorites';
import trackMapAccess from '@salesforce/apex/CapabilityMapController.trackMapAccess';
import toggleFavorite from '@salesforce/apex/CapabilityMapController.toggleFavorite';
import deleteCapability from '@salesforce/apex/CapabilityController.deleteCapability';
import moveCapability from '@salesforce/apex/CapabilityController.moveCapability';
import bulkUpdateCapabilities from '@salesforce/apex/CapabilityController.bulkUpdateCapabilities';

// Size definitions
const SIZE_DEFS = [
    { id: 'XS', label: 'XS', description: 'Extra Small' },
    { id: 'S', label: 'S', description: 'Small' },
    { id: 'M', label: 'M', description: 'Medium' },
    { id: 'L', label: 'L', description: 'Large' },
    { id: 'XL', label: 'XL', description: 'Extra Large' },
    { id: 'XXL', label: 'XXL', description: 'Very Large' },
    { id: 'XXXL', label: 'XXXL', description: 'Huge' },
    { id: 'TBD', label: 'TBD', description: 'To Be Determined' }
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
    @track customPhaseColors = {}; // Map of phase name to hex color
    @track myFavorites = []; // User's favorite/recent maps
    @track projectsSectionExpanded = false; // Collapsed by default

    // UI State
    @track isLoading = false;
    @track searchTerm = '';
    @track viewFilter = 'all'; // 'all', 'sized', 'tbd'
    @track activeFilters = new Set();
    @track selectedIds = new Set();
    @track zoom = 1;
    @track expandedColors = new Set(); // Track which color groups are expanded
    @track applyColorToAll = false; // When true, bypass phase-color locking
    @track selectedPhaseFilters = new Set(); // Selected phase filters
    @track selectedSizeFilters = new Set(); // Selected size filters
    
    // Modal state
    @track showCapabilityModal = false;
    @track showCategoryModal = false;
    @track showTemplateModal = false;
    @track showBulkSizeModal = false;
    @track showBulkPhaseModal = false;
    @track showBulkTeamModal = false;
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
        
        // Load user's favorites
        this.loadFavorites();
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    // Load user's favorite/recent maps
    async loadFavorites() {
        try {
            const favorites = await getMyFavorites();
            this.myFavorites = favorites.map(fav => ({
                ...fav,
                starClass: fav.isFavorite ? 'favorite-star active' : 'favorite-star',
                starIcon: fav.isFavorite ? '★' : '☆',
                lastAccessedFormatted: this.formatRelativeTime(fav.lastAccessed)
            }));
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    // Format datetime as relative time
    formatRelativeTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
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

    get hasFavorites() {
        return this.myFavorites && this.myFavorites.length > 0;
    }

    get projectsSectionIcon() {
        return this.projectsSectionExpanded ? '▼' : '▶';
    }

    toggleProjectsSection() {
        this.projectsSectionExpanded = !this.projectsSectionExpanded;
    }

    // Get available phases from capabilities
    get availablePhases() {
        const phases = new Set();
        this.capabilities.forEach(cap => {
            if (cap.Phase__c) {
                phases.add(cap.Phase__c);
            }
        });
        // Sort by phase number
        return [...phases].sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '999', 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || '999', 10);
            return numA - numB;
        });
    }

    // Phase filter options with selected state
    get phaseFilterOptions() {
        return this.availablePhases.map(phase => ({
            value: phase,
            label: phase.replace('Phase ', 'P'),
            chipClass: this.selectedPhaseFilters.has(phase) ? 'filter-chip active' : 'filter-chip'
        }));
    }

    // Size filter options with selected state
    get sizeFilterOptions() {
        return SIZE_DEFS.map(size => ({
            value: size.id,
            label: size.id,
            chipClass: this.selectedSizeFilters.has(size.id) ? 'filter-chip active' : 'filter-chip'
        }));
    }

    // Check if any filters are active
    get hasActiveFilters() {
        return this.selectedPhaseFilters.size > 0 || this.selectedSizeFilters.size > 0;
    }

    // Handle phase filter click
    handlePhaseFilterClick(event) {
        const phase = event.currentTarget.dataset.value;
        if (this.selectedPhaseFilters.has(phase)) {
            this.selectedPhaseFilters.delete(phase);
        } else {
            this.selectedPhaseFilters.add(phase);
        }
        // Trigger reactivity
        this.selectedPhaseFilters = new Set(this.selectedPhaseFilters);
    }

    // Handle size filter click
    handleSizeFilterClick(event) {
        const size = event.currentTarget.dataset.value;
        if (this.selectedSizeFilters.has(size)) {
            this.selectedSizeFilters.delete(size);
        } else {
            this.selectedSizeFilters.add(size);
        }
        // Trigger reactivity
        this.selectedSizeFilters = new Set(this.selectedSizeFilters);
    }

    // Clear all filters
    handleClearFilters() {
        this.selectedPhaseFilters = new Set();
        this.selectedSizeFilters = new Set();
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

    // Check if custom phase colors are defined
    get hasCustomPhaseColors() {
        return Object.keys(this.customPhaseColors).length > 0;
    }

    // Phase legend for canvas (only shows when custom colors defined)
    get phaseLegendItems() {
        if (!this.hasCustomPhaseColors) return [];
        
        return Object.entries(this.customPhaseColors).map(([phaseName, color]) => {
            const count = this.capabilities.filter(c => c.Phase__c === phaseName).length;
            return {
                id: phaseName,
                label: phaseName,
                color: color,
                count,
                colorStyle: `background-color: ${color}`,
                itemClass: 'phase-legend-item'
            };
        });
    }

    // Color palette options - click to set color on selected capabilities
    get colorOptions() {
        const colors = [
            { id: 'blue', name: 'Blue', hex: '#0176D3' },
            { id: 'purple', name: 'Purple', hex: '#8B5CF6' },
            { id: 'emerald', name: 'Emerald', hex: '#10B981' },
            { id: 'orange', name: 'Cobra Orange', hex: '#F97316' },
            { id: 'green', name: 'Cobra Green', hex: '#22C55E' },
            { id: 'red', name: 'Red', hex: '#EF4444' },
            { id: 'teal', name: 'Teal', hex: '#14B8A6' },
            { id: 'pink', name: 'Pink', hex: '#EC4899' },
            { id: 'amber', name: 'Amber', hex: '#F59E0B' },
            { id: 'slate', name: 'Slate', hex: '#64748B' }
        ];
        
        return colors.map(c => ({
            ...c,
            style: `background-color: ${c.hex}`,
            squareClass: 'color-square'
        }));
    }

    // Color names mapping
    colorNames = {
        '#0176D3': 'Blue',
        '#8B5CF6': 'Purple',
        '#10B981': 'Emerald',
        '#F97316': 'Orange',
        '#22C55E': 'Green',
        '#EF4444': 'Red',
        '#14B8A6': 'Teal',
        '#EC4899': 'Pink',
        '#F59E0B': 'Amber',
        '#64748B': 'Slate'
    };

    // Check if any capabilities have colors
    get hasColoredCapabilities() {
        return this.capabilities.some(c => c.Color__c);
    }

    // Color breakdown grouped by color with phase and size counts
    get colorBreakdown() {
        // Group capabilities by color
        const colorGroups = {};
        
        // Only include capabilities that have an explicit color assigned
        this.capabilities.forEach(cap => {
            if (!cap.Color__c) return; // Skip capabilities without explicit color
            
            const color = cap.Color__c;
            if (!colorGroups[color]) {
                colorGroups[color] = {
                    color,
                    name: this.colorNames[color] || 'Custom',
                    phases: new Set(),
                    sizes: {}
                };
            }
            // Track phases for this color
            if (cap.Phase__c) {
                colorGroups[color].phases.add(cap.Phase__c);
            }
            const size = cap.Size__c || 'TBD';
            colorGroups[color].sizes[size] = (colorGroups[color].sizes[size] || 0) + 1;
        });
        
        // Convert to array with size breakdown
        const result = Object.values(colorGroups).map(group => {
            const sizeShades = generateColorShades(group.color);
            const sizes = SIZE_DEFS
                .filter(s => group.sizes[s.id] > 0) // Only show sizes with count > 0
                .map(s => ({
                    size: s.id,
                    label: s.description,
                    count: group.sizes[s.id],
                    badgeStyle: `background-color: ${sizeShades[s.id]}; color: ${getTextColor(sizeShades[s.id])}`
                }));
            
            const total = Object.values(group.sizes).reduce((sum, c) => sum + c, 0);
            const isExpanded = this.expandedColors.has(group.color);
            
            // Convert phases Set to sorted array and join (empty string if no phases)
            const phasesArray = [...group.phases].sort();
            const phaseLabel = phasesArray.length > 0 ? phasesArray.join(', ') : '';
            const hasPhase = phasesArray.length > 0;
            
            // Extract phase number for sorting (e.g., "Phase 1" -> 1, "Phase 2" -> 2)
            let phaseNumber = 999; // Default for items without phase
            if (phasesArray.length > 0) {
                const match = phasesArray[0].match(/(\d+)/);
                if (match) {
                    phaseNumber = parseInt(match[1], 10);
                }
            }
            
            return {
                color: group.color,
                name: group.name,
                phaseLabel,
                hasPhase,
                phaseNumber,
                colorStyle: `background-color: ${group.color}`,
                total,
                sizes,
                isExpanded,
                expandIcon: isExpanded ? '▼' : '▶'
            };
        }).filter(g => g.total > 0); // Only show colors with capabilities
        
        // Sort by phase number (1, 2, 3, 4, then no phase)
        result.sort((a, b) => a.phaseNumber - b.phaseNumber);
        
        return result;
    }

    // Toggle color group expansion
    toggleColorGroup(event) {
        const color = event.currentTarget.dataset.color;
        if (this.expandedColors.has(color)) {
            this.expandedColors.delete(color);
        } else {
            this.expandedColors.add(color);
        }
        // Trigger reactivity
        this.expandedColors = new Set(this.expandedColors);
    }

    // Clear selection
    handleClearSelection() {
        this.selectedIds = new Set();
    }

    // Check if all capabilities are selected
    get allSelected() {
        return this.capabilities.length > 0 && 
               this.selectedIds.size === this.capabilities.length;
    }

    // Handle select all checkbox
    handleSelectAllChange(event) {
        if (event.target.checked) {
            // Select all capabilities
            this.selectedIds = new Set(this.capabilities.map(c => c.Id));
        } else {
            // Deselect all
            this.selectedIds = new Set();
        }
    }

    // Check if selected capabilities have sizes (not TBD)
    get selectedHaveSizes() {
        return this.capabilities.some(c => 
            this.selectedIds.has(c.Id) && c.Size__c && c.Size__c !== 'TBD'
        );
    }

    // Check if selected capabilities have phases
    get selectedHavePhases() {
        return this.capabilities.some(c => 
            this.selectedIds.has(c.Id) && c.Phase__c
        );
    }

    // Reset size to TBD for selected capabilities
    async handleResetSize() {
        if (this.selectedIds.size === 0) return;
        
        this.isLoading = true;
        try {
            await bulkUpdateCapabilities({
                capabilityIds: [...this.selectedIds],
                fields: { Size__c: 'TBD' }
            });
            
            // Update in memory - TBD has 0 hours
            this.capabilities = this.capabilities.map(cap => {
                if (this.selectedIds.has(cap.Id)) {
                    return { 
                        ...cap, 
                        Size__c: 'TBD',
                        Calculated_Hours__c: cap.Hours_Override__c || 0
                    };
                }
                return { ...cap };
            });
            
            this.toast(`Reset size for ${this.selectedIds.size} capabilities`);
        } catch (error) {
            console.error('Error resetting size:', error);
            this.toast('Error resetting size', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Reset phase to TBD for selected capabilities
    async handleResetPhase() {
        if (this.selectedIds.size === 0) return;
        
        this.isLoading = true;
        try {
            await bulkUpdateCapabilities({
                capabilityIds: [...this.selectedIds],
                fields: { Phase__c: 'TBD' }
            });
            
            // Update in memory
            this.capabilities = this.capabilities.map(cap => {
                if (this.selectedIds.has(cap.Id)) {
                    return { ...cap, Phase__c: 'TBD' };
                }
                return { ...cap };
            });
            
            this.toast(`Reset phase to TBD for ${this.selectedIds.size} capabilities`);
        } catch (error) {
            console.error('Error resetting phase:', error);
            this.toast('Error resetting phase', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Reset ALL colors (wipe colors for all capabilities)
    async handleResetAllColors() {
        const coloredCaps = this.capabilities.filter(c => c.Color__c);
        if (coloredCaps.length === 0) return;
        
        // Confirm with user
        if (!confirm(`This will clear colors from ${coloredCaps.length} capabilities. Continue?`)) {
            return;
        }
        
        this.isLoading = true;
        try {
            await bulkUpdateCapabilities({
                capabilityIds: coloredCaps.map(c => c.Id),
                fields: { Color__c: null }
            });
            
            // Update in memory
            this.capabilities = this.capabilities.map(cap => {
                return { ...cap, Color__c: null };
            });
            
            this.changedColorIds.clear();
            this.hasUnsavedChanges = false;
            this.toast(`Cleared colors from ${coloredCaps.length} capabilities`);
        } catch (error) {
            console.error('Error resetting colors:', error);
            this.toast('Error resetting colors', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Handle color selection - applies color to selected capabilities
    handleColorSelect(event) {
        const selectedColor = event.currentTarget.dataset.color;
        
        if (this.selectedIds.size === 0) {
            this.toast('Select capabilities first', 'warning');
            return;
        }
        
        // If "Apply to all phases" is checked, just apply to selected without restrictions
        if (this.applyColorToAll) {
            this.capabilities = this.capabilities.map(cap => {
                if (this.selectedIds.has(cap.Id)) {
                    this.changedColorIds.add(cap.Id);
                    return { ...cap, Color__c: selectedColor };
                }
                return { ...cap };
            });
            
            this.hasUnsavedChanges = true;
            this.toast(`Color applied to ${this.selectedIds.size} capabilities - click Save to persist`);
            return;
        }
        
        // Get phases of selected capabilities
        const selectedCaps = this.capabilities.filter(c => this.selectedIds.has(c.Id));
        const phasesInSelection = [...new Set(selectedCaps.map(c => c.Phase__c).filter(Boolean))];
        
        // Build current phase-color mapping and color-phase mapping from ALL capabilities
        const phaseColorMap = {}; // phase -> color
        const colorPhaseMap = {}; // color -> phase
        this.capabilities.forEach(cap => {
            if (cap.Phase__c && cap.Color__c) {
                if (!phaseColorMap[cap.Phase__c]) {
                    phaseColorMap[cap.Phase__c] = cap.Color__c;
                }
                if (!colorPhaseMap[cap.Color__c]) {
                    colorPhaseMap[cap.Color__c] = cap.Phase__c;
                }
            }
        });
        
        // Check if this color is already used by a DIFFERENT phase
        const existingPhaseForColor = colorPhaseMap[selectedColor];
        if (existingPhaseForColor && !phasesInSelection.includes(existingPhaseForColor)) {
            this.toast(`Cannot use ${this.colorNames[selectedColor] || 'this color'}: already assigned to ${existingPhaseForColor}. Check "All phases" to override.`, 'warning');
            return;
        }
        
        // Check for conflicts: is this phase already assigned a DIFFERENT color?
        const conflicts = [];
        phasesInSelection.forEach(phase => {
            const existingColor = phaseColorMap[phase];
            if (existingColor && existingColor !== selectedColor) {
                // Check if there are OTHER capabilities (not selected) with this phase and different color
                const otherCapsWithPhase = this.capabilities.filter(c => 
                    c.Phase__c === phase && 
                    !this.selectedIds.has(c.Id) && 
                    c.Color__c && 
                    c.Color__c !== selectedColor
                );
                if (otherCapsWithPhase.length > 0) {
                    conflicts.push({
                        phase,
                        existingColor,
                        count: otherCapsWithPhase.length
                    });
                }
            }
        });
        
        if (conflicts.length > 0) {
            // Show conflict warning
            const conflictMsg = conflicts.map(c => 
                `${c.phase} already uses ${this.colorNames[c.existingColor] || 'another color'} (${c.count} items)`
            ).join(', ');
            this.toast(`Cannot change: ${conflictMsg}. Change all items of that phase together.`, 'warning');
            return;
        }
        
        // No conflicts - apply color to selected capabilities
        // Also apply to ALL capabilities with the same phases (to keep consistency)
        const affectedIds = new Set(this.selectedIds);
        
        // Find all other capabilities with the same phases and add them
        phasesInSelection.forEach(phase => {
            this.capabilities.forEach(cap => {
                if (cap.Phase__c === phase) {
                    affectedIds.add(cap.Id);
                }
            });
        });
        
        // Update color on all affected capabilities
        this.capabilities = this.capabilities.map(cap => {
            if (affectedIds.has(cap.Id)) {
                this.changedColorIds.add(cap.Id);
                return { ...cap, Color__c: selectedColor };
            }
            return { ...cap };
        });
        
        const extraCount = affectedIds.size - this.selectedIds.size;
        const extraMsg = extraCount > 0 ? ` (+${extraCount} same phase)` : '';
        
        this.hasUnsavedChanges = true;
        this.toast(`Color applied to ${affectedIds.size} capabilities${extraMsg} - click Save to persist`);
    }

    // Handle "Apply to all phases" checkbox change
    handleApplyAllChange(event) {
        this.applyColorToAll = event.target.checked;
    }

    // Track unsaved changes
    @track hasUnsavedChanges = false;
    changedColorIds = new Set(); // Track which capabilities have color changes

    // Save color changes to database
    async handleSaveColors() {
        if (this.changedColorIds.size === 0) {
            this.toast('No color changes to save');
            return;
        }
        
        this.isLoading = true;
        
        try {
            // Group by color to minimize API calls
            const colorGroups = {};
            this.capabilities.forEach(cap => {
                if (this.changedColorIds.has(cap.Id)) {
                    const color = cap.Color__c || '#0176D3';
                    if (!colorGroups[color]) colorGroups[color] = [];
                    colorGroups[color].push(cap.Id);
                }
            });
            
            // Update each color group
            for (const [color, ids] of Object.entries(colorGroups)) {
                await bulkUpdateCapabilities({
                    capabilityIds: ids,
                    fields: { Color__c: color }
                });
            }
            
            this.changedColorIds.clear();
            this.hasUnsavedChanges = false;
            
            // Force reactivity by creating new array
            this.capabilities = [...this.capabilities];
            
            this.toast('Colors saved successfully');
        } catch (error) {
            console.error('Error saving colors:', error);
            this.toast('Error saving colors', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    get categoriesWithCapabilities() {
        const search = this.searchTerm.toLowerCase();
        const hasPhaseFilter = this.selectedPhaseFilters.size > 0;
        const hasSizeFilter = this.selectedSizeFilters.size > 0;
        const hasAnyFilter = hasPhaseFilter || hasSizeFilter;
        
        return this.categories.map(category => {
            // Filter capabilities for this category
            let categoryCapabilities = this.capabilities.filter(cap => {
                // Must belong to this category
                if (cap.Capability_Category__c !== category.Id) return false;
                
                // Search filter
                if (search && !cap.Name.toLowerCase().includes(search)) return false;
                
                // Size filter (old filter - hide completely)
                if (this.activeFilters.size > 0 && this.activeFilters.has(cap.Size__c)) return false;
                
                // View filter
                if (this.viewFilter === 'tbd' && cap.Size__c !== 'TBD') return false;
                if (this.viewFilter === 'sized' && cap.Size__c === 'TBD') return false;
                
                return true;
            });

            // Add selection state and computed properties
            // Each capability uses its own Color__c (grey if not set)
            categoryCapabilities = categoryCapabilities.map(cap => {
                const baseColor = cap.Color__c || '#9CA3AF'; // Default grey (no color assigned)
                const sizeShades = generateColorShades(baseColor);
                const bgColor = sizeShades[cap.Size__c] || '#E8E8E8';
                const txtColor = getTextColor(bgColor);
                
                // Check if this tile matches the active filters
                let matchesFilter = true;
                if (hasPhaseFilter && !this.selectedPhaseFilters.has(cap.Phase__c)) {
                    matchesFilter = false;
                }
                if (hasSizeFilter && !this.selectedSizeFilters.has(cap.Size__c)) {
                    matchesFilter = false;
                }
                
                // Build tile class
                let tileClass = 'capability-tile';
                if (this.selectedIds.has(cap.Id)) {
                    tileClass += ' multi-selected';
                }
                if (hasAnyFilter && !matchesFilter) {
                    tileClass += ' blurred';
                }
                
                return {
                    ...cap,
                    isSelected: this.selectedIds.has(cap.Id),
                    displayHours: cap.Calculated_Hours__c || 0,
                    displayPhase: cap.Phase__c || '',
                    tileStyle: `background-color: ${bgColor}; color: ${txtColor}`,
                    tileClass
                };
            });

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
            
            // Load custom phase colors
            const phaseColors = data.phaseColors || [];
            this.customPhaseColors = {};
            phaseColors.forEach(pc => {
                this.customPhaseColors[pc.Name] = pc.Color__c;
            });
            
            // Track map access for favorites
            this.trackAccess();
            
        } catch (error) {
            console.error('Error loading map data:', error);
            this.toast('Error loading data', 'error');
        }
    }

    // Track user accessing this map (for favorites/recently viewed)
    async trackAccess() {
        if (!this.mapId) return;
        try {
            await trackMapAccess({ mapId: this.mapId });
            // Refresh favorites list
            this.loadFavorites();
        } catch (error) {
            console.error('Error tracking access:', error);
        }
    }

    // Handle clicking on a favorite map
    async handleFavoriteClick(event) {
        const mapId = event.currentTarget.dataset.id;
        this.isLoading = true;
        
        try {
            const data = await getMapWithData({ mapId: mapId });
            this.mapId = mapId;
            this.mapName = data.map?.Name || 'Capability Map';
            this.capabilityMap = data.map;
            
            const cats = [...(data.categories || [])];
            cats.sort((a, b) => (a.Sort_Order__c || 0) - (b.Sort_Order__c || 0));
            this.categories = cats;
            this.capabilities = [...(data.capabilities || [])];
            this.appliedTemplates = data.appliedTemplates || [];
            
            // Track access
            this.trackAccess();
            this.saveHistory();
            
        } catch (error) {
            console.error('Error loading favorite map:', error);
            this.toast('Error loading map', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Toggle favorite status
    async handleToggleFavorite(event) {
        event.stopPropagation();
        const mapId = event.currentTarget.dataset.id;
        
        try {
            const newStatus = await toggleFavorite({ mapId: mapId });
            // Update local state
            this.myFavorites = this.myFavorites.map(fav => {
                if (fav.id === mapId) {
                    return {
                        ...fav,
                        isFavorite: newStatus,
                        starClass: newStatus ? 'favorite-star active' : 'favorite-star',
                        starIcon: newStatus ? '★' : '☆'
                    };
                }
                return fav;
            });
            this.toast(newStatus ? 'Added to favorites' : 'Removed from favorites');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.toast('Error updating favorite', 'error');
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
        
        if (event.shiftKey) {
            // Shift+click: single select (replace selection)
            this.selectedIds = new Set([capId]);
        } else {
            // Normal click: toggle in multi-select mode (add/remove from selection)
            this.toggleSelection(capId);
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
        
        // Add to selection if not already selected
        if (!this.selectedIds.has(capId)) {
            this.toggleSelection(capId);
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

    handleBulkChangePhase() {
        if (this.selectedIds.size === 0) return;
        this.showBulkPhaseModal = true;
    }

    handleBulkAssignTeam() {
        if (this.selectedIds.size === 0) return;
        this.showBulkTeamModal = true;
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

    handleCloseBulkPhaseModal() {
        this.showBulkPhaseModal = false;
    }

    handleCloseBulkTeamModal() {
        this.showBulkTeamModal = false;
    }

    // Helper: Get hours for a given size based on map configuration
    getHoursForSize(size) {
        if (!this.capabilityMap || !size || size === 'TBD') return 0;
        
        const sizeToField = {
            'XS': 'XS_Hours__c',
            'S': 'S_Hours__c',
            'M': 'M_Hours__c',
            'L': 'L_Hours__c',
            'XL': 'XL_Hours__c',
            'XXL': 'XXL_Hours__c',
            'XXXL': 'XXXL_Hours__c'
        };
        
        const field = sizeToField[size];
        return field ? (this.capabilityMap[field] || 0) : 0;
    }

    // Handle bulk size applied - update UI immediately including hours
    async handleBulkApplied(event) {
        this.showBulkSizeModal = false;
        
        const { field, value } = event.detail;
        
        // Calculate new hours based on size
        const newHours = this.getHoursForSize(value);
        
        // Update capabilities in memory immediately - both size and calculated hours
        this.capabilities = this.capabilities.map(cap => {
            if (this.selectedIds.has(cap.Id)) {
                return { 
                    ...cap, 
                    [field]: value,
                    Calculated_Hours__c: cap.Hours_Override__c || newHours
                };
            }
            return { ...cap };
        });
        
        this.markModified();
        this.saveHistory();
        this.toast(`Updated size to ${value} for ${this.selectedIds.size} items`);
    }

    // Handle bulk phase applied - update UI immediately and sync color
    async handleBulkPhaseApplied(event) {
        this.showBulkPhaseModal = false;
        
        const { field, value } = event.detail; // value = new phase name
        
        // Find if this phase already has a color assigned (from other capabilities)
        let phaseColor = null;
        this.capabilities.forEach(cap => {
            if (cap.Phase__c === value && cap.Color__c && !phaseColor) {
                phaseColor = cap.Color__c;
            }
        });
        
        // Update capabilities in memory - also update color if phase has one
        this.capabilities = this.capabilities.map(cap => {
            if (this.selectedIds.has(cap.Id)) {
                const updates = { ...cap, [field]: value };
                // If the new phase has a color, apply it
                if (phaseColor) {
                    updates.Color__c = phaseColor;
                }
                return updates;
            }
            return { ...cap };
        });
        
        // If we changed colors, also save them to database
        if (phaseColor) {
            try {
                await bulkUpdateCapabilities({
                    capabilityIds: [...this.selectedIds],
                    fields: { Color__c: phaseColor }
                });
            } catch (error) {
                console.error('Error updating colors:', error);
            }
        }
        
        this.markModified();
        this.saveHistory();
        const colorMsg = phaseColor ? ` (color: ${this.colorNames[phaseColor] || 'assigned'})` : '';
        this.toast(`Updated phase to ${value} for ${this.selectedIds.size} items${colorMsg}`);
    }

    // Handle bulk team applied - reload to get updated role assignments
    async handleBulkTeamApplied(event) {
        this.showBulkTeamModal = false;
        
        // Team assignments are in a related object, so we need to reload
        await this.loadMapData();
        
        this.markModified();
        this.saveHistory();
        this.toast(`Updated team for ${this.selectedIds.size} items`);
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