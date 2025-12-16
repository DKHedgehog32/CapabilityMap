/**
 * ============================================================
 * CapabilityController.cls
 * ============================================================
 * @description    Controller for Capability__c operations
 * 
 * @author         Cobra CRM B.V.
 * @version        2.3.6
 * 
 * CHANGELOG:
 * v2.3.6  2024-12-16  Changed Estimated_Hours__c to Calculated_Hours__c
 * v2.3.5  2024-12-15  Added null validation
 * ============================================================
 */
public with sharing class CapabilityController {
    
    @AuraEnabled(cacheable=true)
    public static List<Capability__c> getCapabilitiesForCategory(Id categoryId) {
        return [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                   Hours_Override__c, Description__c, Capability_Category__c
            FROM Capability__c
            WHERE Capability_Category__c = :categoryId
            ORDER BY Sort_Order__c
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Capability__c> getCapabilitiesForMap(Id mapId) {
        return [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                   Hours_Override__c, Description__c, Capability_Category__c
            FROM Capability__c
            WHERE Capability_Category__r.Capability_Map__c = :mapId
            ORDER BY Capability_Category__c, Sort_Order__c
        ];
    }
    
    @AuraEnabled
    public static Capability__c createCapability(Id categoryId, String name, String size, String phase, String description) {
        if (categoryId == null) {
            throw new AuraHandledException('Category ID is required');
        }
        if (String.isBlank(name)) {
            throw new AuraHandledException('Name is required');
        }
        
        Integer maxOrder = 0;
        AggregateResult[] results = [
            SELECT MAX(Sort_Order__c) maxOrder FROM Capability__c 
            WHERE Capability_Category__c = :categoryId
        ];
        if (results[0].get('maxOrder') != null) {
            maxOrder = Integer.valueOf(results[0].get('maxOrder'));
        }
        
        Capability__c newCap = new Capability__c(
            Name = name,
            Capability_Category__c = categoryId,
            Size__c = String.isNotBlank(size) ? size : 'TBD',
            Phase__c = String.isNotBlank(phase) ? phase : 'Phase 1',
            Sort_Order__c = maxOrder + 1,
            Description__c = description
        );
        insert newCap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                       Hours_Override__c, Description__c, Capability_Category__c
                FROM Capability__c WHERE Id = :newCap.Id];
    }
    
    @AuraEnabled
    public static Capability__c updateCapability(Id capabilityId, String name, Id categoryId, 
                                                  String size, String phase, String description) {
        if (capabilityId == null) {
            throw new AuraHandledException('Capability ID is required');
        }
        
        Capability__c cap = new Capability__c(Id = capabilityId);
        
        if (String.isNotBlank(name)) cap.Name = name;
        if (String.isNotBlank(size)) cap.Size__c = size;
        if (String.isNotBlank(phase)) cap.Phase__c = phase;
        if (categoryId != null) cap.Capability_Category__c = categoryId;
        cap.Description__c = description;
        
        update cap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                       Hours_Override__c, Description__c, Capability_Category__c
                FROM Capability__c WHERE Id = :capabilityId];
    }
    
    @AuraEnabled
    public static void deleteCapability(Id capabilityId) {
        if (capabilityId == null) {
            throw new AuraHandledException('Capability ID is required');
        }
        delete [SELECT Id FROM Capability__c WHERE Id = :capabilityId];
    }
    
    @AuraEnabled
    public static void bulkUpdateCapabilities(List<Id> capabilityIds, Map<String, Object> fields) {
        if (capabilityIds == null || capabilityIds.isEmpty()) {
            throw new AuraHandledException('Capability IDs are required');
        }
        if (fields == null || fields.isEmpty()) {
            throw new AuraHandledException('Fields are required');
        }
        
        List<Capability__c> toUpdate = new List<Capability__c>();
        
        for (Id capId : capabilityIds) {
            Capability__c cap = new Capability__c(Id = capId);
            if (fields.containsKey('Size__c')) cap.Size__c = (String)fields.get('Size__c');
            if (fields.containsKey('Phase__c')) cap.Phase__c = (String)fields.get('Phase__c');
            toUpdate.add(cap);
        }
        
        update toUpdate;
    }
    
    @AuraEnabled
    public static void moveCapability(Id capabilityId, Id newCategoryId, Integer newSortOrder) {
        if (capabilityId == null) {
            throw new AuraHandledException('Capability ID is required');
        }
        if (newCategoryId == null) {
            throw new AuraHandledException('Category ID is required');
        }
        
        Capability__c cap = new Capability__c(
            Id = capabilityId,
            Capability_Category__c = newCategoryId,
            Sort_Order__c = newSortOrder != null ? newSortOrder : 1
        );
        update cap;
    }
    
    @AuraEnabled
    public static void reorderCapabilities(Id categoryId, List<Id> capabilityIds) {
        if (capabilityIds == null || capabilityIds.isEmpty()) {
            return;
        }
        
        List<Capability__c> toUpdate = new List<Capability__c>();
        for (Integer i = 0; i < capabilityIds.size(); i++) {
            toUpdate.add(new Capability__c(
                Id = capabilityIds[i],
                Capability_Category__c = categoryId,
                Sort_Order__c = i + 1
            ));
        }
        update toUpdate;
    }
}