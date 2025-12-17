/**
 * ============================================================
 * bulkOperationsModal.js
 * ============================================================
 * @description    Bulk Operations Modal for Size, Phase, and Team
 * @author         Cobra CRM B.V.
 * @version        2.4.0
 * 
 * CHANGELOG:
 * ─────────────────────────────────────────────────────────────
 * v2.4.0  2024-12-16  Added Phase and Team Member operations
 * v2.3.0  2024-12-15  Initial version with Size only
 * ============================================================
 */
import { LightningElement, api, track } from 'lwc';
import bulkUpdateCapabilities from '@salesforce/apex/CapabilityController.bulkUpdateCapabilities';
import getRoles from '@salesforce/apex/CapabilityController.getRoles';
import bulkAssignRoles from '@salesforce/apex/CapabilityController.bulkAssignRoles';

const SIZES = [
    { id: 'XS', label: 'XS', color: '#10B981', textColor: 'white' },      // Emerald
    { id: 'S', label: 'S', color: '#22C55E', textColor: 'white' },        // Green
    { id: 'M', label: 'M', color: '#0176D3', textColor: 'white' },        // Salesforce Blue
    { id: 'L', label: 'L', color: '#8B5CF6', textColor: 'white' },        // Purple
    { id: 'XL', label: 'XL', color: '#F97316', textColor: 'white' },      // Orange
    { id: 'XXL', label: 'XXL', color: '#EF4444', textColor: 'white' },    // Red
    { id: 'XXXL', label: 'XXXL', color: '#DC2626', textColor: 'white' },  // Dark Red
    { id: 'TBD', label: 'TBD', color: '#9CA3AF', textColor: 'white' }     // Gray
];

const PHASES = [
    { id: 'Phase 1', label: 'Phase 1', color: '#22c55e' },
    { id: 'Phase 2', label: 'Phase 2', color: '#3b82f6' },
    { id: 'Phase 3', label: 'Phase 3', color: '#8b5cf6' },
    { id: 'Phase 4', label: 'Phase 4', color: '#f97316' },
    { id: 'Future', label: 'Future', color: '#6b7280' },
    { id: 'Out of Scope', label: 'Out of Scope', color: '#ef4444' }
];

export default class BulkOperationsModal extends LightningElement {
    @api selectedCapabilityIds = [];
    @api operationType = 'size'; // 'size', 'phase', or 'team'
    @api mapId;
    
    @track selectedSize = 'M';
    @track selectedPhase = 'Phase 1';
    @track selectedRoleId = '';
    @track allocationPercent = 100;
    @track roles = [];
    @track isLoading = false;

    connectedCallback() {
        if (this.operationType === 'team') {
            this.loadRoles();
        }
    }

    async loadRoles() {
        try {
            this.isLoading = true;
            this.roles = await getRoles({ mapId: this.mapId });
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            this.isLoading = false;
        }
    }

    get selectedCount() {
        return this.selectedCapabilityIds.length;
    }

    get modalTitle() {
        switch (this.operationType) {
            case 'phase': return `Change Phase (${this.selectedCount} items)`;
            case 'team': return `Assign Team Member (${this.selectedCount} items)`;
            default: return `Change Size (${this.selectedCount} items)`;
        }
    }

    get isSizeOperation() { return this.operationType === 'size'; }
    get isPhaseOperation() { return this.operationType === 'phase'; }
    get isTeamOperation() { return this.operationType === 'team'; }

    get sizeOptions() {
        return SIZES.map(size => ({
            ...size,
            optionClass: size.id === this.selectedSize ? 'size-option selected' : 'size-option',
            style: `background-color: ${size.color}; color: ${size.textColor};`
        }));
    }

    get phaseOptions() {
        return PHASES.map(phase => ({
            ...phase,
            optionClass: phase.id === this.selectedPhase ? 'phase-option selected' : 'phase-option',
            style: `background-color: ${phase.color}; color: white;`
        }));
    }

    get roleOptions() {
        return this.roles.map(role => ({
            label: role.Name,
            value: role.Id
        }));
    }

    get hasRoles() {
        return this.roles.length > 0;
    }

    handleSizeSelect(event) {
        this.selectedSize = event.currentTarget.dataset.size;
    }

    handlePhaseSelect(event) {
        this.selectedPhase = event.currentTarget.dataset.phase;
    }

    handleRoleChange(event) {
        this.selectedRoleId = event.target.value;
    }

    handleAllocationChange(event) {
        this.allocationPercent = parseInt(event.target.value, 10) || 100;
    }

    handleOverlayClick(event) {
        if (event.target === event.currentTarget) this.handleClose();
    }
    
    stopPropagation(event) { event.stopPropagation(); }
    
    handleClose() { this.dispatchEvent(new CustomEvent('close')); }

    async handleApply() {
        try {
            this.isLoading = true;
            
            if (this.operationType === 'size') {
                const fields = { 'Size__c': this.selectedSize };
                await bulkUpdateCapabilities({
                    capabilityIds: this.selectedCapabilityIds,
                    fields: fields
                });
                this.dispatchEvent(new CustomEvent('applied', {
                    detail: { field: 'Size__c', value: this.selectedSize }
                }));
            } else if (this.operationType === 'phase') {
                const fields = { 'Phase__c': this.selectedPhase };
                await bulkUpdateCapabilities({
                    capabilityIds: this.selectedCapabilityIds,
                    fields: fields
                });
                this.dispatchEvent(new CustomEvent('applied', {
                    detail: { field: 'Phase__c', value: this.selectedPhase }
                }));
            } else if (this.operationType === 'team') {
                if (!this.selectedRoleId) {
                    alert('Please select a team member');
                    return;
                }
                await bulkAssignRoles({
                    capabilityIds: this.selectedCapabilityIds,
                    roleId: this.selectedRoleId,
                    allocationPercent: this.allocationPercent / 100
                });
                this.dispatchEvent(new CustomEvent('applied', {
                    detail: { field: 'Team', value: this.selectedRoleId }
                }));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + (error.body?.message || error.message));
        } finally {
            this.isLoading = false;
        }
    }
}