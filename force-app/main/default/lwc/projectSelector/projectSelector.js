/**
 * ============================================================
 * projectSelector.js
 * ============================================================
 * @description    Collapsible Project Selector for sidebar
 *                 Allows linking to project OR creating standalone map
 * 
 * @author         Cobra CRM B.V.
 * @version        2.3.9
 * 
 * CHANGELOG:
 * ─────────────────────────────────────────────────────────────
 * v2.3.9  2024-12-16  Fixed dropdown visibility with fixed positioning
 * v2.3.8  2024-12-16  Made collapsible for sidebar placement
 * v2.3.7  2024-12-16  Added option for standalone map
 * ============================================================
 */
import { LightningElement, track } from 'lwc';
import isKlientAvailable from '@salesforce/apex/KlientIntegrationService.isKlientAvailable';
import getProjects from '@salesforce/apex/KlientIntegrationService.getProjects';

export default class ProjectSelector extends LightningElement {
    @track searchTerm = '';
    @track projects = [];
    @track isSearching = false;
    @track showDropdown = false;
    @track klientAvailable = null;
    @track standaloneMapName = '';
    @track mode = 'project';
    @track isExpanded = true;
    @track dropdownStyle = '';

    searchTimeout;

    connectedCallback() {
        this.checkKlientAvailability();
    }

    async checkKlientAvailability() {
        try {
            this.klientAvailable = await isKlientAvailable();
        } catch (error) {
            console.error('Error checking Klient availability:', error);
            this.klientAvailable = false;
        }
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
    }

    get expandIcon() {
        return this.isExpanded ? '▼' : '▶';
    }

    get isLoading() {
        return this.klientAvailable === null;
    }

    get showModeToggle() {
        return this.klientAvailable === true;
    }

    get showKlientSearch() {
        return this.klientAvailable === true && this.mode === 'project';
    }

    get showStandaloneInput() {
        return this.klientAvailable === false || this.mode === 'standalone';
    }

    get hasProjects() {
        return this.projects.length > 0;
    }

    get projectModeClass() {
        return this.mode === 'project' ? 'mode-btn active' : 'mode-btn';
    }

    get standaloneModeClass() {
        return this.mode === 'standalone' ? 'mode-btn active' : 'mode-btn';
    }

    handleModeChange(event) {
        this.mode = event.currentTarget.dataset.mode;
        this.searchTerm = '';
        this.projects = [];
        this.showDropdown = false;
        this.standaloneMapName = '';
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        
        clearTimeout(this.searchTimeout);
        
        if (this.searchTerm.length >= 2) {
            this.searchTimeout = setTimeout(() => {
                this.searchProjects();
            }, 300);
        } else {
            this.projects = [];
            this.showDropdown = false;
        }
    }

    async searchProjects() {
        this.isSearching = true;
        try {
            const result = await getProjects({ searchTerm: this.searchTerm });
            this.projects = result.map(p => ({
                Id: p.Id,
                Name: p.Name,
                Krow__Project_Status__c: p.Status || 'Active'
            }));
            
            if (this.projects.length > 0) {
                this.positionDropdown();
                this.showDropdown = true;
            } else {
                this.showDropdown = false;
            }
        } catch (error) {
            console.error('Error searching projects:', error);
            this.projects = [];
        } finally {
            this.isSearching = false;
        }
    }

    positionDropdown() {
        // Get the input element position
        const input = this.template.querySelector('.selector-input');
        if (input) {
            const rect = input.getBoundingClientRect();
            this.dropdownStyle = `top: ${rect.bottom + 4}px; left: ${rect.left}px; width: ${rect.width}px;`;
        }
    }

    handleFocus() {
        if (this.projects.length > 0) {
            this.positionDropdown();
            this.showDropdown = true;
        }
    }

    handleBlur() {
        setTimeout(() => {
            this.showDropdown = false;
        }, 200);
    }

    handleProjectSelect(event) {
        const projectId = event.currentTarget.dataset.id;
        const project = this.projects.find(p => p.Id === projectId);
        
        if (project) {
            this.dispatchEvent(new CustomEvent('projectselected', {
                detail: {
                    projectId: project.Id,
                    projectName: project.Name
                }
            }));
            this.isExpanded = false;
        }
        
        this.showDropdown = false;
    }

    handleStandaloneNameChange(event) {
        this.standaloneMapName = event.target.value;
    }

    handleCreateStandaloneMap() {
        if (!this.standaloneMapName.trim()) {
            return;
        }
        
        this.dispatchEvent(new CustomEvent('projectselected', {
            detail: {
                projectId: null,
                projectName: this.standaloneMapName.trim()
            }
        }));
        this.isExpanded = false;
    }

    handleStandaloneKeyUp(event) {
        if (event.key === 'Enter') {
            this.handleCreateStandaloneMap();
        }
    }
}