/**
 * @description Controller for Capability Role operations
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class CapabilityRoleController {
    
    @AuraEnabled(cacheable=true)
    public static List<Capability_Role__c> getRolesByMap(Id mapId) {
        return [
            SELECT Id, Name, Hourly_Rate__c, Color__c, Sort_Order__c, Description__c
            FROM Capability_Role__c
            WHERE Capability_Map__c = :mapId
            
            ORDER BY Sort_Order__c
        ];
    }
    
    @AuraEnabled
    public static Capability_Role__c createRole(Id mapId, String name, Decimal hourlyRate, String color) {
        Integer maxOrder = 0;
        AggregateResult[] results = [
            SELECT MAX(Sort_Order__c) maxOrder FROM Capability_Role__c 
            WHERE Capability_Map__c = :mapId 
        ];
        if (results[0].get('maxOrder') != null) {
            maxOrder = Integer.valueOf(results[0].get('maxOrder'));
        }
        
        Capability_Role__c newRole = new Capability_Role__c(
            Name = name,
            Capability_Map__c = mapId,
            Hourly_Rate__c = hourlyRate,
            Color__c = color,
            Sort_Order__c = maxOrder + 1
        );
        insert newRole;
        return newRole;
    }
    
    @AuraEnabled
    public static Capability_Role__c updateRole(Id roleId, String name, Decimal hourlyRate, String color) {
        Capability_Role__c role = new Capability_Role__c(
            Id = roleId,
            Name = name,
            Hourly_Rate__c = hourlyRate,
            Color__c = color
        );
        update role;
        return [SELECT Id, Name, Hourly_Rate__c, Color__c, Sort_Order__c FROM Capability_Role__c WHERE Id = :roleId ];
    }
    
    @AuraEnabled
    public static void deleteRole(Id roleId) {
        delete [SELECT Id FROM Capability_Role__c WHERE Id = :roleId ];
    }
    
    @AuraEnabled
    public static List<Capability_Role_Assignment__c> getAssignmentsByCapability(Id capabilityId) {
        return [
            SELECT Id, Capability_Role__c, Capability_Role__r.Name, 
                   Capability_Role__r.Color__c, Allocation_Percent__c, Allocated_Hours__c
            FROM Capability_Role_Assignment__c
            WHERE Capability__c = :capabilityId
            
        ];
    }
    
    @AuraEnabled
    public static Capability_Role_Assignment__c createAssignment(Id capabilityId, Id roleId, Decimal allocationPercent) {
        Capability_Role_Assignment__c assignment = new Capability_Role_Assignment__c(
            Capability__c = capabilityId,
            Capability_Role__c = roleId,
            Allocation_Percent__c = allocationPercent
        );
        insert assignment;
        return [SELECT Id, Capability_Role__c, Capability_Role__r.Name, Allocation_Percent__c, Allocated_Hours__c 
                FROM Capability_Role_Assignment__c WHERE Id = :assignment.Id ];
    }
    
    @AuraEnabled
    public static void updateAssignment(Id assignmentId, Decimal allocationPercent) {
        update new Capability_Role_Assignment__c(
            Id = assignmentId,
            Allocation_Percent__c = allocationPercent
        );
    }
    
    @AuraEnabled
    public static void deleteAssignment(Id assignmentId) {
        delete [SELECT Id FROM Capability_Role_Assignment__c WHERE Id = :assignmentId ];
    }
    
    @AuraEnabled
    public static void saveAssignments(Id capabilityId, List<Map<String, Object>> assignments) {
        // Delete existing assignments
        delete [SELECT Id FROM Capability_Role_Assignment__c WHERE Capability__c = :capabilityId ];
        
        // Create new assignments
        List<Capability_Role_Assignment__c> newAssignments = new List<Capability_Role_Assignment__c>();
        for (Map<String, Object> assignment : assignments) {
            newAssignments.add(new Capability_Role_Assignment__c(
                Capability__c = capabilityId,
                Capability_Role__c = (Id)assignment.get('roleId'),
                Allocation_Percent__c = Decimal.valueOf(String.valueOf(assignment.get('allocationPercent')))
            ));
        }
        insert newAssignments;
    }
}
