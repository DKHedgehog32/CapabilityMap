/**
 * @description Controller for Capability Category operations
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class CapabilityCategoryController {
    
    @AuraEnabled(cacheable=true)
    public static List<Capability_Category__c> getCategoriesByMap(Id mapId) {
        return [
            SELECT Id, Name, Sort_Order__c, Is_Subcategory__c, ArchiMate_Id__c
            FROM Capability_Category__c
            WHERE Capability_Map__c = :mapId
            WITH SECURITY_ENFORCED
            ORDER BY Sort_Order__c
        ];
    }
    
    @AuraEnabled
    public static Capability_Category__c createCategory(Id mapId, String name, Boolean isSubcategory) {
        Integer maxOrder = 0;
        AggregateResult[] results = [
            SELECT MAX(Sort_Order__c) maxOrder FROM Capability_Category__c 
            WHERE Capability_Map__c = :mapId WITH SECURITY_ENFORCED
        ];
        if (results[0].get('maxOrder') != null) {
            maxOrder = Integer.valueOf(results[0].get('maxOrder'));
        }
        
        Capability_Category__c newCat = new Capability_Category__c(
            Name = name,
            Capability_Map__c = mapId,
            Sort_Order__c = maxOrder + 1,
            Is_Subcategory__c = isSubcategory != null ? isSubcategory : false
        );
        insert newCat;
        return newCat;
    }
    
    @AuraEnabled
    public static Capability_Category__c updateCategory(Id categoryId, String name, Boolean isSubcategory) {
        Capability_Category__c cat = new Capability_Category__c(
            Id = categoryId,
            Name = name,
            Is_Subcategory__c = isSubcategory
        );
        update cat;
        return [SELECT Id, Name, Sort_Order__c, Is_Subcategory__c FROM Capability_Category__c WHERE Id = :categoryId WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static void deleteCategory(Id categoryId) {
        // Capabilities will be cascade deleted due to Master-Detail
        delete [SELECT Id FROM Capability_Category__c WHERE Id = :categoryId WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static void reorderCategories(List<Id> categoryIds) {
        List<Capability_Category__c> toUpdate = new List<Capability_Category__c>();
        for (Integer i = 0; i < categoryIds.size(); i++) {
            toUpdate.add(new Capability_Category__c(
                Id = categoryIds[i],
                Sort_Order__c = i + 1
            ));
        }
        update toUpdate;
    }
}
