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
                   Calculated_Hours__c, Hours_Override__c, Description__c,
                   Capability_Category__c, Capability_Category__r.Name,
                   ArchiMate_Id__c
            FROM Capability__c
            WHERE Capability_Category__r.Capability_Map__c = :mapId
            
            ORDER BY Capability_Category__c, Sort_Order__c
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Capability__c> getCapabilitiesByCategory(Id categoryId) {
        return [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, 
                   Calculated_Hours__c, Hours_Override__c, Description__c
            FROM Capability__c
            WHERE Capability_Category__c = :categoryId
            
            ORDER BY Sort_Order__c
        ];
    }
    
    @AuraEnabled
    public static Capability__c createCapability(Id categoryId, String name, String size, String phase) {
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
            Sort_Order__c = maxOrder + 1
        );
        insert newCap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c 
                FROM Capability__c WHERE Id = :newCap.Id ];
    }
    
    /**
     * @description Update an existing capability
     * @param capabilityId The capability ID to update
     * @param name The capability name
     * @param categoryId The category ID
     * @param size The size value
     * @param phase The phase value
     * @param description The description
     * @return Updated Capability__c record
     */
    @AuraEnabled
    public static Capability__c updateCapability(Id capabilityId, String name, Id categoryId, 
                                                  String size, String phase, String description) {
        Capability__c cap = new Capability__c(Id = capabilityId);
        
        if (String.isNotBlank(name)) cap.Name = name;
        if (String.isNotBlank(size)) cap.Size__c = size;
        if (String.isNotBlank(phase)) cap.Phase__c = phase;
        if (categoryId != null) cap.Capability_Category__c = categoryId;
        cap.Description__c = description; // Can be blank
        
        update cap;
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                       Hours_Override__c, Description__c, Capability_Category__c
                FROM Capability__c WHERE Id = :capabilityId ];
    }
    
    /**
     * @description Update capability with a map of fields (for bulk/flexible updates)
     * @param capabilityId The capability ID
     * @param fields Map of field names to values
     * @return Updated Capability__c record
     */
    @AuraEnabled
    public static Capability__c updateCapabilityFields(Id capabilityId, Map<String, Object> fields) {
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
        return [SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Calculated_Hours__c, 
                       Hours_Override__c, Description__c, Capability_Category__c
                FROM Capability__c WHERE Id = :capabilityId ];
    }
    
    @AuraEnabled
    public static void deleteCapability(Id capabilityId) {
        delete [SELECT Id FROM Capability__c WHERE Id = :capabilityId ];
    }
    
    @AuraEnabled
    public static void bulkUpdateCapabilities(List<Id> capabilityIds, Map<String, Object> fields) {
        List<Capability__c> toUpdate = new List<Capability__c>();
        
        for (Id capId : capabilityIds) {
            Capability__c cap = new Capability__c(Id = capId);
            
            // Handle Size__c
            if (fields.containsKey('Size__c')) {
                Object sizeVal = fields.get('Size__c');
                cap.Size__c = (sizeVal == null || String.isBlank((String)sizeVal)) ? null : (String)sizeVal;
            }
            
            // Handle Phase__c
            if (fields.containsKey('Phase__c')) {
                Object phaseVal = fields.get('Phase__c');
                cap.Phase__c = (phaseVal == null || String.isBlank((String)phaseVal)) ? null : (String)phaseVal;
            }
            
            // Handle Color__c
            if (fields.containsKey('Color__c')) {
                Object colorVal = fields.get('Color__c');
                cap.Color__c = (colorVal == null || String.isBlank((String)colorVal)) ? null : (String)colorVal;
            }
            
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

    /**
     * @description Get all roles for a capability map
     * @param mapId The capability map ID
     * @return List of Capability_Role__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Capability_Role__c> getRoles(Id mapId) {
        return [
            SELECT Id, Name, Color__c, Hourly_Rate__c
            FROM Capability_Role__c
            WHERE Capability_Map__c = :mapId
            ORDER BY Name
        ];
    }

    /**
     * @description Bulk assign a role to multiple capabilities
     * @param capabilityIds List of capability IDs
     * @param roleId The role to assign
     * @param allocationPercent The allocation percentage (0-1)
     */
    @AuraEnabled
    public static void bulkAssignRoles(List<Id> capabilityIds, Id roleId, Decimal allocationPercent) {
        if (capabilityIds == null || capabilityIds.isEmpty() || roleId == null) {
            return;
        }

        // Get existing assignments for these capabilities and role
        Map<Id, Capability_Role_Assignment__c> existingAssignments = new Map<Id, Capability_Role_Assignment__c>();
        for (Capability_Role_Assignment__c assignment : [
            SELECT Id, Capability__c 
            FROM Capability_Role_Assignment__c 
            WHERE Capability__c IN :capabilityIds AND Capability_Role__c = :roleId
        ]) {
            existingAssignments.put(assignment.Capability__c, assignment);
        }

        List<Capability_Role_Assignment__c> toUpsert = new List<Capability_Role_Assignment__c>();
        
        for (Id capId : capabilityIds) {
            Capability_Role_Assignment__c assignment;
            if (existingAssignments.containsKey(capId)) {
                // Update existing
                assignment = existingAssignments.get(capId);
            } else {
                // Create new
                assignment = new Capability_Role_Assignment__c(
                    Capability__c = capId,
                    Capability_Role__c = roleId
                );
            }
            assignment.Allocation_Percent__c = allocationPercent;
            toUpsert.add(assignment);
        }

        upsert toUpsert;
    }
}