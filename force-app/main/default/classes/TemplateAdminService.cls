/**
 * @description Service for template administration
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class TemplateAdminService {
    
    @AuraEnabled
    public static Capability_Template__c createTemplate(String templateName, String cloudCategory, String description) {
        Capability_Template__c template = new Capability_Template__c(
            Template_Name__c = templateName,
            Cloud_Category__c = cloudCategory,
            Description__c = description,
            Version__c = '1.0',
            Is_Active__c = true,
            Is_Standard__c = false
        );
        insert template;
        return template;
    }
    
    @AuraEnabled
    public static Capability_Template_Category__c addTemplateCategory(Id templateId, String name, Integer sortOrder) {
        Capability_Template_Category__c cat = new Capability_Template_Category__c(
            Name = name,
            Capability_Template__c = templateId,
            Sort_Order__c = sortOrder
        );
        insert cat;
        return cat;
    }
    
    @AuraEnabled
    public static Capability_Template_Item__c addTemplateItem(Id categoryId, String name, String defaultSize, Integer sortOrder) {
        Capability_Template_Item__c item = new Capability_Template_Item__c(
            Name = name,
            Capability_Template_Category__c = categoryId,
            Default_Size__c = defaultSize,
            Sort_Order__c = sortOrder
        );
        insert item;
        return item;
    }
    
    @AuraEnabled
    public static void deleteTemplate(Id templateId) {
        delete [SELECT Id FROM Capability_Template__c WHERE Id = :templateId WITH SECURITY_ENFORCED];
    }
    
    @AuraEnabled
    public static Capability_Template__c cloneTemplate(Id sourceTemplateId, String newName) {
        Map<String, Object> sourceData = CapabilityTemplateController.getTemplateWithItems(sourceTemplateId);
        Capability_Template__c source = (Capability_Template__c)sourceData.get('template');
        
        Capability_Template__c newTemplate = new Capability_Template__c(
            Template_Name__c = newName,
            Cloud_Category__c = source.Cloud_Category__c,
            Description__c = source.Description__c,
            Version__c = '1.0',
            Is_Active__c = true,
            Is_Standard__c = false
        );
        insert newTemplate;
        
        // Clone categories and items
        List<Capability_Template_Category__c> sourceCategories = (List<Capability_Template_Category__c>)sourceData.get('categories');
        List<Capability_Template_Item__c> sourceItems = (List<Capability_Template_Item__c>)sourceData.get('items');
        Map<Id, Id> catIdMap = new Map<Id, Id>();
        
        for (Capability_Template_Category__c sourceCat : sourceCategories) {
            Capability_Template_Category__c newCat = new Capability_Template_Category__c(
                Name = sourceCat.Name,
                Capability_Template__c = newTemplate.Id,
                Sort_Order__c = sourceCat.Sort_Order__c,
                Is_Subcategory__c = sourceCat.Is_Subcategory__c
            );
            insert newCat;
            catIdMap.put(sourceCat.Id, newCat.Id);
        }
        
        for (Capability_Template_Item__c sourceItem : sourceItems) {
            Capability_Template_Item__c newItem = new Capability_Template_Item__c(
                Name = sourceItem.Name,
                Capability_Template_Category__c = catIdMap.get(sourceItem.Capability_Template_Category__c),
                Default_Size__c = sourceItem.Default_Size__c,
                Default_Phase__c = sourceItem.Default_Phase__c,
                Sort_Order__c = sourceItem.Sort_Order__c
            );
            insert newItem;
        }
        
        return newTemplate;
    }
}
