import { LightningElement, api } from 'lwc';

export default class CapabilityTile extends LightningElement {
    @api capability;
    @api roles = [];
    @api roleAssignments = [];

    sizeColors = {
        'XS': '#22c55e', 'S': '#84cc16', 'M': '#eab308', 'L': '#f97316',
        'XL': '#ef4444', 'XXL': '#dc2626', 'XXXL': '#991b1b', 'TBD': '#9ca3af'
    };

    phaseColors = {
        'Phase 1': '#22c55e', 'Phase 2': '#3b82f6', 'Phase 3': '#8b5cf6',
        'Phase 4': '#f97316', 'Future': '#6b7280', 'Out of Scope': '#ef4444'
    };

    get tileStyle() {
        const color = this.sizeColors[this.capability?.Size__c] || '#9ca3af';
        return `border-left: 4px solid ${color}`;
    }

    get phaseBadgeStyle() {
        const color = this.phaseColors[this.capability?.Phase__c] || '#6b7280';
        return `background-color: ${color}`;
    }

    get displayHours() {
        return this.capability?.Calculated_Hours__c || 0;
    }

    get assignedRoles() {
        if (!this.capability || !this.roleAssignments) return [];
        return this.roleAssignments
            .filter(ra => ra.Capability__c === this.capability.Id)
            .map(ra => {
                const role = this.roles.find(r => r.Id === ra.Capability_Role__c);
                return {
                    id: ra.Id,
                    name: role?.Name || 'Unknown',
                    color: role?.Color__c || '#0176d3',
                    percent: ra.Allocation_Percent__c
                };
            });
    }

    handleClick() {
        this.dispatchEvent(new CustomEvent('capabilityclick', {
            detail: { capabilityId: this.capability.Id }
        }));
    }
}