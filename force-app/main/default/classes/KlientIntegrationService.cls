/**
 * @description Service for Klient PSA integration
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 * 
 * CHANGELOG:
 * 2024-12-15 - v2.3.0 - Initial creation
 * 2024-12-15 - v2.3.1 - Fixed field name: Krow__Project_Status__c (not Krow__Status__c)
 */
public with sharing class KlientIntegrationService {
    
    /**
     * @description Search for Klient projects by name
     * @param searchTerm The search term to filter projects
     * @return List<Krow__Project__c> Matching projects
     */
    @AuraEnabled(cacheable=true)
    public static List<Krow__Project__c> getProjects(String searchTerm) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [
            SELECT Id, Name, Krow__Project_Status__c
            FROM Krow__Project__c
            WHERE Name LIKE :searchPattern
            WITH SECURITY_ENFORCED
            ORDER BY Name
            LIMIT 50
        ];
    }
    
    /**
     * @description Get a specific Klient project by ID
     * @param projectId The project ID
     * @return Krow__Project__c The project record
     */
    @AuraEnabled(cacheable=true)
    public static Krow__Project__c getProjectById(Id projectId) {
        return [
            SELECT Id, Name, Krow__Project_Status__c
            FROM Krow__Project__c
            WHERE Id = :projectId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
    }
    
    /**
     * @description Check if a project already has a capability map
     * @param projectId The project ID to check
     * @return Boolean True if map exists
     */
    @AuraEnabled(cacheable=true)
    public static Boolean hasCapabilityMap(Id projectId) {
        return [SELECT COUNT() FROM Capability_Map__c WHERE Krow_Project__c = :projectId WITH SECURITY_ENFORCED] > 0;
    }
}
