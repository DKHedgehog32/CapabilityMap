/**
 * @description Main container component for Capability Map Tool
 * @author Cobra CRM B.V.
 * @version 2.3.0
 */
import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getMapByProject from '@salesforce/apex/CapabilityMapController.getMapByProject';
import getMapWithData from '@salesforce/apex/CapabilityMapController.getMapWithData';
import createMap from '@salesforce/apex/CapabilityMapController.createMap';
import saveMap from '@salesforce/apex/CapabilityMapController.saveMap';

export default class CapabilityMapApp extends LightningElement {
    @track selectedProjectId;
    @track selectedProjectName;
    @track capabilityMap;
    @track categories = [];
    @track capabilities = [];
    @track roles = [];
    @track roleAssignments = [];
    @track appliedTemplates = [];
    
    @track isLoading = false;
    @track hasUnsavedChanges = false;
    @track showTemplateModal = false;
    @track showHoursConfigModal = false;
    
    autoSaveInterval;

    get hasMap() {
        return this.capabilityMap != null;
    }

    get mapStatusClass() {
        if (!this.capabilityMap) return '';
        return `status-${this.capabilityMap.Status__c?.toLowerCase()}`;
    }

    handleProjectSelected(event) {
        this.selectedProjectId = event.detail.projectId;
        this.selectedProjectName = event.detail.projectName;
        this.loadMapForProject();
    }

    async loadMapForProject() {
        if (!this.selectedProjectId) return;
        
        this.isLoading = true;
        try {
            const map = await getMapByProject({ projectId: this.selectedProjectId });
            
            if (map) {
                this.capabilityMap = map;
                await this.loadMapData();
            } else {
                this.capabilityMap = null;
                this.categories = [];
                this.capabilities = [];
                this.roles = [];
            }
        } catch (error) {
            this.showToast('Error', error.body?.message || 'Failed to load map', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async loadMapData() {
        if (!this.capabilityMap?.Id) return;
        
        try {
            const data = await getMapWithData({ mapId: this.capabilityMap.Id });
            this.categories = data.categories || [];
            this.capabilities = data.capabilities || [];
            this.roles = data.roles || [];
            this.roleAssignments = data.roleAssignments || [];
            this.appliedTemplates = data.appliedTemplates || [];
        } catch (error) {
            this.showToast('Error', 'Failed to load map data', 'error');
        }
    }

    async handleCreateMap() {
        if (!this.selectedProjectId) return;
        
        this.isLoading = true;
        try {
            const mapName = `${this.selectedProjectName} - Capability Map`;
            this.capabilityMap = await createMap({ 
                projectId: this.selectedProjectId, 
                mapName: mapName 
            });
            this.showToast('Success', 'Capability map created', 'success');
            this.showTemplateModal = true;
        } catch (error) {
            this.showToast('Error', error.body?.message || 'Failed to create map', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async handleSave() {
        if (!this.capabilityMap?.Id) return;
        
        this.isLoading = true;
        try {
            this.capabilityMap = await saveMap({ mapId: this.capabilityMap.Id });
            this.hasUnsavedChanges = false;
            this.showToast('Success', 'Map saved successfully', 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to save map', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleOpenTemplates() {
        this.showTemplateModal = true;
    }

    handleCloseTemplates() {
        this.showTemplateModal = false;
    }

    handleTemplatesApplied() {
        this.showTemplateModal = false;
        this.loadMapData();
        this.hasUnsavedChanges = true;
    }

    handleOpenHoursConfig() {
        this.showHoursConfigModal = true;
    }

    handleCloseHoursConfig() {
        this.showHoursConfigModal = false;
    }

    handleHoursUpdated(event) {
        this.capabilityMap = event.detail.map;
        this.showHoursConfigModal = false;
        this.loadMapData();
    }

    handleDataChanged() {
        this.hasUnsavedChanges = true;
    }

    handleMapCleared() {
        this.categories = [];
        this.capabilities = [];
        this.hasUnsavedChanges = false;
    }

    handleMapDeleted() {
        this.capabilityMap = null;
        this.categories = [];
        this.capabilities = [];
        this.roles = [];
        this.hasUnsavedChanges = false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    disconnectedCallback() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}
