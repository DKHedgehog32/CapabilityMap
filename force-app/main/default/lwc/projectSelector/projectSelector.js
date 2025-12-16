/**
 * @description    Project Selector for Klient PSA integration
 *                 Falls back to standalone mode if Klient not installed
 * 
 * @author         Cobra CRM B.V.
 * @version        2.3.2
 */
import { LightningElement, track } from 'lwc';
import isKlientAvailable from '@salesforce/apex/KlientIntegrationService.isKlientAvailable';
import getProjects from '@salesforce/apex/KlientIntegrationService.getProjects';

export default class ProjectSelector extends LightningElement {
    @track searchTerm = '';
    @track projects = [];
    @track isSearching = false;
    @track showDropdown = false;
    @track klientAvailable = null; // null = checking, true/false = result
    @track standaloneMapName = 'New Capability Map';

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

    get isLoading() {
        return this.klientAvailable === null;
    }

    get showKlientSearch() {
        return this.klientAvailable === true;
    }

    get showStandaloneInput() {
        return this.klientAvailable === false;
    }

    get hasProjects() {
        return this.projects.length > 0;
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
            // Convert the result to expected format
            this.projects = result.map(p => ({
                Id: p.Id,
                Name: p.Name,
                Krow__Project_Status__c: p.Status || 'Active'
            }));
            this.showDropdown = this.projects.length > 0;
        } catch (error) {
            console.error('Error searching projects:', error);
            this.projects = [];
        } finally {
            this.isSearching = false;
        }
    }

    handleFocus() {
        if (this.projects.length > 0) {
            this.showDropdown = true;
        }
    }

    handleBlur() {
        // Delay to allow click to register
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
                projectId: null, // No project linked
                projectName: this.standaloneMapName
            }
        }));
    }
}
