/**
 * @description Service for Klient PSA integration
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class KlientIntegrationService {
    
    @AuraEnabled(cacheable=true)
    public static List<Krow__Project__c> getProjects(String searchTerm) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [
            SELECT Id, Name, Krow__Status__c
            FROM Krow__Project__c
            WHERE Name LIKE :searchPattern
            WITH SECURITY_ENFORCED
            ORDER BY Name
            LIMIT 50
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static Krow__Project__c getProjectById(Id projectId) {
        return [
            SELECT Id, Name, Krow__Status__c
            FROM Krow__Project__c
            WHERE Id = :projectId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static Boolean hasCapabilityMap(Id projectId) {
        return [SELECT COUNT() FROM Capability_Map__c WHERE Krow_Project__c = :projectId WITH SECURITY_ENFORCED] > 0;
    }
}
