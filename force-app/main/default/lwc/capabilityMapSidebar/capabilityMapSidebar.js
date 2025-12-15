import { LightningElement, api, track } from 'lwc';

export default class CapabilityMapSidebar extends LightningElement {
    @api mapId;
    @api categories = [];
    @api capabilities = [];
    @api roles = [];
    
    @track searchTerm = '';
    @track selectedPhase = '';
    @track selectedSize = '';

    sizeOptions = [
        { label: 'All Sizes', value: '' },
        { label: 'XS', value: 'XS' },
        { label: 'S', value: 'S' },
        { label: 'M', value: 'M' },
        { label: 'L', value: 'L' },
        { label: 'XL', value: 'XL' },
        { label: 'XXL', value: 'XXL' },
        { label: 'XXXL', value: 'XXXL' },
        { label: 'TBD', value: 'TBD' }
    ];

    phaseOptions = [
        { label: 'All Phases', value: '' },
        { label: 'Phase 1', value: 'Phase 1' },
        { label: 'Phase 2', value: 'Phase 2' },
        { label: 'Phase 3', value: 'Phase 3' },
        { label: 'Phase 4', value: 'Phase 4' },
        { label: 'Future', value: 'Future' },
        { label: 'Out of Scope', value: 'Out of Scope' }
    ];

    sizeColors = {
        'XS': '#22c55e',
        'S': '#84cc16',
        'M': '#eab308',
        'L': '#f97316',
        'XL': '#ef4444',
        'XXL': '#dc2626',
        'XXXL': '#991b1b',
        'TBD': '#9ca3af'
    };

    get statistics() {
        const stats = {
            totalCategories: this.categories.length,
            totalCapabilities: this.capabilities.length,
            totalHours: 0,
            byPhase: {},
            bySize: {}
        };

        this.capabilities.forEach(cap => {
            stats.totalHours += cap.Estimated_Hours__c || 0;
            
            const phase = cap.Phase__c || 'Unassigned';
            stats.byPhase[phase] = (stats.byPhase[phase] || 0) + 1;
            
            const size = cap.Size__c || 'TBD';
            stats.bySize[size] = (stats.bySize[size] || 0) + 1;
        });

        return stats;
    }

    get sizeLegend() {
        return Object.entries(this.sizeColors).map(([size, color]) => ({
            size,
            color,
            style: `background-color: ${color}`
        }));
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.dispatchFilterChange();
    }

    handlePhaseChange(event) {
        this.selectedPhase = event.detail.value;
        this.dispatchFilterChange();
    }

    handleSizeChange(event) {
        this.selectedSize = event.detail.value;
        this.dispatchFilterChange();
    }

    dispatchFilterChange() {
        this.dispatchEvent(new CustomEvent('filterchange', {
            detail: {
                searchTerm: this.searchTerm,
                phase: this.selectedPhase,
                size: this.selectedSize
            }
        }));
    }
}
