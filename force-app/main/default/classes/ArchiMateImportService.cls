/**
 * @description Service for importing ArchiMate capability models
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class ArchiMateImportService {
    
    @AuraEnabled
    public static Map<String, Object> importArchiMateJson(Id mapId, String jsonContent) {
        Map<String, Object> result = new Map<String, Object>();
        List<Capability_Category__c> createdCategories = new List<Capability_Category__c>();
        List<Capability__c> createdCapabilities = new List<Capability__c>();
        
        try {
            Map<String, Object> archiData = (Map<String, Object>)JSON.deserializeUntyped(jsonContent);
            List<Object> elements = (List<Object>)archiData.get('elements');
            
            Map<String, Id> archiIdToCategoryId = new Map<String, Id>();
            Integer categoryOrder = 0;
            Integer capabilityOrder = 0;
            
            // First pass: create categories (ApplicationComponent or Grouping)
            for (Object elem : elements) {
                Map<String, Object> element = (Map<String, Object>)elem;
                String elementType = (String)element.get('type');
                
                if (elementType == 'Grouping' || elementType == 'ApplicationComponent') {
                    categoryOrder++;
                    Capability_Category__c cat = new Capability_Category__c(
                        Name = (String)element.get('name'),
                        Capability_Map__c = mapId,
                        Sort_Order__c = categoryOrder,
                        ArchiMate_Id__c = (String)element.get('id')
                    );
                    insert cat;
                    createdCategories.add(cat);
                    archiIdToCategoryId.put((String)element.get('id'), cat.Id);
                }
            }
            
            // Second pass: create capabilities (Capability elements)
            for (Object elem : elements) {
                Map<String, Object> element = (Map<String, Object>)elem;
                String elementType = (String)element.get('type');
                
                if (elementType == 'Capability') {
                    capabilityOrder++;
                    // Find parent category from relationships or use first category
                    Id categoryId = createdCategories.isEmpty() ? null : createdCategories[0].Id;
                    
                    if (categoryId != null) {
                        Capability__c cap = new Capability__c(
                            Name = (String)element.get('name'),
                            Capability_Category__c = categoryId,
                            Size__c = 'TBD',
                            Phase__c = 'Phase 1',
                            Sort_Order__c = capabilityOrder,
                            ArchiMate_Id__c = (String)element.get('id')
                        );
                        insert cap;
                        createdCapabilities.add(cap);
                    }
                }
            }
            
            result.put('success', true);
            result.put('categoriesCreated', createdCategories.size());
            result.put('capabilitiesCreated', createdCapabilities.size());
        } catch (Exception e) {
            result.put('success', false);
            result.put('error', e.getMessage());
        }
        
        return result;
    }
}
