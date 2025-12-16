/**
 * @description Service for Map lifecycle operations (clear, reset, delete)
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class MapLifecycleService {
    
    @AuraEnabled
    public static void clearMapContents(Id mapId) {
        // Delete all categories (capabilities cascade delete via M-D)
        delete [SELECT Id FROM Capability_Category__c WHERE Capability_Map__c = :mapId ];
        // Delete all roles (assignments cascade delete via M-D)
        delete [SELECT Id FROM Capability_Role__c WHERE Capability_Map__c = :mapId ];
        // Delete template links
        delete [SELECT Id FROM Capability_Map_Template__c WHERE Capability_Map__c = :mapId ];
    }
    
    @AuraEnabled
    public static void resetToTemplates(Id mapId) {
        // Get applied templates before clearing
        List<Capability_Map_Template__c> appliedTemplates = [
            SELECT Capability_Template__c FROM Capability_Map_Template__c 
            WHERE Capability_Map__c = :mapId 
        ];
        List<Id> templateIds = new List<Id>();
        for (Capability_Map_Template__c mt : appliedTemplates) {
            templateIds.add(mt.Capability_Template__c);
        }
        
        // Clear map contents
        clearMapContents(mapId);
        
        // Re-apply templates
        if (!templateIds.isEmpty()) {
            CapabilityTemplateController.applyTemplates(mapId, templateIds, true);
        }
    }
    
    @AuraEnabled
    public static void deleteMap(Id mapId) {
        delete [SELECT Id FROM Capability_Map__c WHERE Id = :mapId ];
    }
    
    @AuraEnabled
    public static Map<String, Integer> getMapStatistics(Id mapId) {
        Map<String, Integer> stats = new Map<String, Integer>();
        
        Integer categoryCount = [SELECT COUNT() FROM Capability_Category__c WHERE Capability_Map__c = :mapId ];
        Integer capabilityCount = [SELECT COUNT() FROM Capability__c WHERE Capability_Category__r.Capability_Map__c = :mapId ];
        Integer roleCount = [SELECT COUNT() FROM Capability_Role__c WHERE Capability_Map__c = :mapId ];
        
        stats.put('categories', categoryCount);
        stats.put('capabilities', capabilityCount);
        stats.put('roles', roleCount);
        
        return stats;
    }
}
