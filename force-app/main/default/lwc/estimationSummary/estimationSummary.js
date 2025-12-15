import { LightningElement, api } from 'lwc';

export default class EstimationSummary extends LightningElement {
    @api capabilities = [];
    @api roles = [];
    @api roleAssignments = [];

    get totalHours() { return this.capabilities.reduce((sum, c) => sum + (c.Estimated_Hours__c || 0), 0); }
    get hoursByPhase() {
        const phases = {};
        this.capabilities.forEach(c => { phases[c.Phase__c] = (phases[c.Phase__c] || 0) + (c.Estimated_Hours__c || 0); });
        return Object.entries(phases).map(([phase, hours]) => ({ phase, hours }));
    }
}
