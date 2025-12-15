/**
 * @description Controller for Capability operations
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class CapabilityController {
    
    @AuraEnabled(cacheable=true)
    public static List<Capability__c> getCapabilitiesByMap(Id mapId) {
        return [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, 
                   Estimated_Hours__c, Hours_Override__c, Description__c,
                   Capability_Category__c, Capability_Category__r.Name,
                   ArchiMate_Id__c
            FROM Capability__c
            WHERE Capability_Category__r.Capability_Map__c = :mapId
            WITH SECURITY_ENFORCED
            ORDER BY Capability_Category__c, Sort_Order__c
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Capability__c> getCapabilitiesByCategory(Id categoryId) {
        return [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, 
                   Estimated_Hours__c, Hours_Override__c, Description__c
            FROM Capability__c
            WHERE Capability_Category__c = :categoryId
            WITH SECURITY_ENFORCED
            ORDER BY Sort_Order__c
        ];
    }
    
    @AuraEnabled
    public static Capability__c createCapability(Id categoryId, String name, String size, String phase) {
        Integer maxOrder = 0;
        AggregateResult[] results = [
            SELECT MAX(Sort_Order__c) maxOrder FROM Capability__c 
            WHERE Capability_Category__c = :categoryId WITH SECURITY_ENFORCED
        ];
        if (results[0].get('maxOrder') != null) {
            maxOrder = Integer.valueOf(results[0].get('maxOrder'));
        }
        
        Capability__c newCap = new Capability__c(
            Name = name,
            Capability_Category__c = categoryId,
            Size__c = String.isNotBlank(size) ? size : 'TBD',
            Phase__c = String.isNotBlank(phase) ? phase : 'Phase 1',
            Sort_Order__c = maxOrder + 1
        );
        insert newCap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Estimated_Hours__c 
                FROM Capability__c WHERE Id = :newCap.Id WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static Capability__c updateCapability(Id capabilityId, Map<String, Object> fields) {
        Capability__c cap = new Capability__c(Id = capabilityId);
        
        if (fields.containsKey('Name')) cap.Name = (String)fields.get('Name');
        if (fields.containsKey('Size__c')) cap.Size__c = (String)fields.get('Size__c');
        if (fields.containsKey('Phase__c')) cap.Phase__c = (String)fields.get('Phase__c');
        if (fields.containsKey('Description__c')) cap.Description__c = (String)fields.get('Description__c');
        if (fields.containsKey('Hours_Override__c')) {
            Object hoursVal = fields.get('Hours_Override__c');
            cap.Hours_Override__c = hoursVal != null ? Decimal.valueOf(String.valueOf(hoursVal)) : null;
        }
        if (fields.containsKey('Capability_Category__c')) {
            cap.Capability_Category__c = (Id)fields.get('Capability_Category__c');
        }
        
        update cap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Estimated_Hours__c, 
                       Hours_Override__c, Description__c, Capability_Category__c
                FROM Capability__c WHERE Id = :capabilityId WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static void deleteCapability(Id capabilityId) {
        delete [SELECT Id FROM Capability__c WHERE Id = :capabilityId WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static void bulkUpdateCapabilities(List<Id> capabilityIds, Map<String, Object> fields) {
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
        Capability__c cap = new Capability__c(
            Id = capabilityId,
            Capability_Category__c = newCategoryId,
            Sort_Order__c = newSortOrder
        );
        update cap;
    }
    
    @AuraEnabled
    public static void reorderCapabilities(Id categoryId, List<Id> capabilityIds) {
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
