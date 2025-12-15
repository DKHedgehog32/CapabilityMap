/**
 * @description Controller for Capability Template operations
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 * 
 * CHANGELOG:
 * 2024-12-15 - v2.3.0 - Initial creation with multi-template support
 */
public with sharing class CapabilityTemplateController {
    
    /**
     * @description Get all active templates grouped by category
     * @return List<Capability_Template__c> Active templates
     */
    @AuraEnabled(cacheable=true)
    public static List<Capability_Template__c> getActiveTemplates() {
        return [
            SELECT Id, Name, Template_Name__c, Cloud_Category__c, Version__c,
                   Is_Standard__c, Icon_Name__c, Description__c,
                   (SELECT Id, Name, Sort_Order__c, Is_Subcategory__c 
                    FROM Template_Categories__r ORDER BY Sort_Order__c)
            FROM Capability_Template__c
            WHERE Is_Active__c = true
            WITH SECURITY_ENFORCED
            ORDER BY Cloud_Category__c, Template_Name__c
        ];
    }
    
    /**
     * @description Get template with all categories and items
     * @param templateId The template ID
     * @return Map<String, Object> Template data
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTemplateWithItems(Id templateId) {
        Map<String, Object> result = new Map<String, Object>();
        
        Capability_Template__c template = [
            SELECT Id, Name, Template_Name__c, Cloud_Category__c, Version__c,
                   Is_Standard__c, Icon_Name__c, Description__c
            FROM Capability_Template__c
            WHERE Id = :templateId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        result.put('template', template);
        
        List<Capability_Template_Category__c> categories = [
            SELECT Id, Name, Sort_Order__c, Is_Subcategory__c, Description__c
            FROM Capability_Template_Category__c
            WHERE Capability_Template__c = :templateId
            WITH SECURITY_ENFORCED
            ORDER BY Sort_Order__c
        ];
        result.put('categories', categories);
        
        List<Capability_Template_Item__c> items = [
            SELECT Id, Name, Default_Size__c, Default_Phase__c, Sort_Order__c,
                   Description__c, Capability_Template_Category__c
            FROM Capability_Template_Item__c
            WHERE Capability_Template_Category__r.Capability_Template__c = :templateId
            WITH SECURITY_ENFORCED
            ORDER BY Capability_Template_Category__c, Sort_Order__c
        ];
        result.put('items', items);
        
        return result;
    }
    
    /**
     * @description Apply multiple templates to a capability map
     * @param mapId The capability map ID
     * @param templateIds List of template IDs to apply
     * @param mergeCategories Whether to merge duplicate category names
     * @return Map<String, Object> Result with created categories and capabilities
     */
    @AuraEnabled
    public static Map<String, Object> applyTemplates(Id mapId, List<Id> templateIds, Boolean mergeCategories) {
        Map<String, Object> result = new Map<String, Object>();
        List<Capability_Category__c> createdCategories = new List<Capability_Category__c>();
        List<Capability__c> createdCapabilities = new List<Capability__c>();
        
        // Track category names if merging
        Map<String, Id> categoryNameToId = new Map<String, Id>();
        Integer categoryOrder = getMaxCategorySortOrder(mapId);
        
        for (Id templateId : templateIds) {
            // Record template application
            Capability_Map_Template__c mapTemplate = new Capability_Map_Template__c(
                Capability_Map__c = mapId,
                Capability_Template__c = templateId,
                Applied_Date__c = System.now(),
                Applied_By__c = UserInfo.getUserId()
            );
            insert mapTemplate;
            
            // Get template data
            Map<String, Object> templateData = getTemplateWithItems(templateId);
            List<Capability_Template_Category__c> templateCategories = 
                (List<Capability_Template_Category__c>)templateData.get('categories');
            List<Capability_Template_Item__c> templateItems = 
                (List<Capability_Template_Item__c>)templateData.get('items');
            
            // Map template category IDs to new category IDs
            Map<Id, Id> templateCatToNewCat = new Map<Id, Id>();
            
            // Create categories
            for (Capability_Template_Category__c templateCat : templateCategories) {
                Id newCategoryId;
                
                if (mergeCategories && categoryNameToId.containsKey(templateCat.Name)) {
                    // Use existing category
                    newCategoryId = categoryNameToId.get(templateCat.Name);
                } else {
                    // Create new category
                    categoryOrder++;
                    Capability_Category__c newCat = new Capability_Category__c(
                        Name = templateCat.Name,
                        Capability_Map__c = mapId,
                        Sort_Order__c = categoryOrder,
                        Is_Subcategory__c = templateCat.Is_Subcategory__c
                    );
                    insert newCat;
                    createdCategories.add(newCat);
                    newCategoryId = newCat.Id;
                    categoryNameToId.put(templateCat.Name, newCategoryId);
                }
                
                templateCatToNewCat.put(templateCat.Id, newCategoryId);
            }
            
            // Create capabilities
            for (Capability_Template_Item__c item : templateItems) {
                Id targetCategoryId = templateCatToNewCat.get(item.Capability_Template_Category__c);
                
                Capability__c newCap = new Capability__c(
                    Name = item.Name,
                    Capability_Category__c = targetCategoryId,
                    Size__c = item.Default_Size__c,
                    Phase__c = String.isNotBlank(item.Default_Phase__c) ? item.Default_Phase__c : 'Phase 1',
                    Sort_Order__c = item.Sort_Order__c,
                    Description__c = item.Description__c
                );
                insert newCap;
                createdCapabilities.add(newCap);
            }
        }
        
        result.put('categories', createdCategories);
        result.put('capabilities', createdCapabilities);
        result.put('categoryCount', createdCategories.size());
        result.put('capabilityCount', createdCapabilities.size());
        
        return result;
    }
    
    /**
     * @description Get templates already applied to a map
     * @param mapId The capability map ID
     * @return List<Capability_Map_Template__c> Applied templates
     */
    @AuraEnabled(cacheable=true)
    public static List<Capability_Map_Template__c> getAppliedTemplates(Id mapId) {
        return [
            SELECT Id, Capability_Template__c, Capability_Template__r.Template_Name__c,
                   Capability_Template__r.Cloud_Category__c, Applied_Date__c, 
                   Applied_By__c, Applied_By__r.Name
            FROM Capability_Map_Template__c
            WHERE Capability_Map__c = :mapId
            WITH SECURITY_ENFORCED
            ORDER BY Applied_Date__c DESC
        ];
    }
    
    // Private helper
    private static Integer getMaxCategorySortOrder(Id mapId) {
        AggregateResult[] results = [
            SELECT MAX(Sort_Order__c) maxOrder
            FROM Capability_Category__c
            WHERE Capability_Map__c = :mapId
            WITH SECURITY_ENFORCED
        ];
        Object maxOrder = results[0].get('maxOrder');
        return maxOrder != null ? Integer.valueOf(maxOrder) : 0;
    }
}
