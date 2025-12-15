import { LightningElement, track } from 'lwc';
import getProjects from '@salesforce/apex/KlientIntegrationService.getProjects';

export default class ProjectSelector extends LightningElement {
    @track searchTerm = '';
    @track projects = [];
    @track selectedProject = null;
    @track showDropdown = false;
    @track isSearching = false;

    searchTimeout;

    get hasProjects() {
        return this.projects.length > 0;
    }

    get displayValue() {
        return this.selectedProject ? this.selectedProject.Name : '';
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
            this.projects = await getProjects({ searchTerm: this.searchTerm });
            this.showDropdown = true;
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            this.isSearching = false;
        }
    }

    handleProjectSelect(event) {
        const projectId = event.currentTarget.dataset.id;
        const project = this.projects.find(p => p.Id === projectId);
        
        if (project) {
            this.selectedProject = project;
            this.searchTerm = project.Name;
            this.showDropdown = false;
            
            this.dispatchEvent(new CustomEvent('projectselected', {
                detail: {
                    projectId: project.Id,
                    projectName: project.Name
                }
            }));
        }
    }

    handleFocus() {
        if (this.searchTerm.length >= 2) {
            this.showDropdown = true;
        }
    }

    handleBlur() {
        setTimeout(() => {
            this.showDropdown = false;
        }, 200);
    }

    handleClear() {
        this.searchTerm = '';
        this.selectedProject = null;
        this.projects = [];
        this.showDropdown = false;
    }
}
