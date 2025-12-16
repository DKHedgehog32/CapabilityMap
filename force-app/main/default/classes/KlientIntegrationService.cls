/**
 * @description    Service for Klient PSA integration
 *                 Handles cases where Klient package is not installed
 * 
 * @author         Cobra CRM B.V.
 * @date           2024-12-15
 * @version        2.3.2
 * 
 * CHANGELOG:
 * 2024-12-15 - v2.3.0 - Initial creation
 * 2024-12-15 - v2.3.1 - Fixed field name: Krow__Project_Status__c
 * 2024-12-15 - v2.3.2 - Added graceful handling when Klient not installed
 */
public with sharing class KlientIntegrationService {
    
    // Check if Klient package is installed
    private static Boolean isKlientInstalled {
        get {
            if (isKlientInstalled == null) {
                try {
                    // Try to describe the Klient Project object
                    Schema.DescribeSObjectResult describeResult = 
                        Schema.getGlobalDescribe().get('Krow__Project__c')?.getDescribe();
                    isKlientInstalled = (describeResult != null);
                } catch (Exception e) {
                    isKlientInstalled = false;
                }
            }
            return isKlientInstalled;
        }
        set;
    }
    
    /**
     * @description Check if Klient PSA is available in the org
     * @return Boolean True if Klient is installed
     */
    @AuraEnabled(cacheable=true)
    public static Boolean isKlientAvailable() {
        return isKlientInstalled;
    }
    
    /**
     * @description Search for Klient projects by name
     * @param searchTerm The search term to filter projects
     * @return List<Map<String,Object>> Matching projects (generic format)
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getProjects(String searchTerm) {
        List<Map<String, Object>> results = new List<Map<String, Object>>();
        
        if (!isKlientInstalled) {
            // Return empty list if Klient not installed
            return results;
        }
        
        try {
            String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
            
            // Use dynamic SOQL to avoid compile-time dependency
            String query = 'SELECT Id, Name, Krow__Project_Status__c ' +
                          'FROM Krow__Project__c ' +
                          'WHERE Name LIKE :searchPattern ' +
                          'ORDER BY Name LIMIT 50';
            
            List<SObject> projects = Database.query(query);
            
            for (SObject proj : projects) {
                Map<String, Object> projectMap = new Map<String, Object>();
                projectMap.put('Id', proj.get('Id'));
                projectMap.put('Name', proj.get('Name'));
                projectMap.put('Status', proj.get('Krow__Project_Status__c'));
                results.add(projectMap);
            }
        } catch (Exception e) {
            // Log error but don't throw - just return empty results
            System.debug('Error querying Klient projects: ' + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * @description Get a specific Klient project by ID
     * @param projectId The project ID
     * @return Map<String, Object> The project record
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProjectById(Id projectId) {
        Map<String, Object> result = new Map<String, Object>();
        
        if (!isKlientInstalled || projectId == null) {
            return result;
        }
        
        try {
            String query = 'SELECT Id, Name, Krow__Project_Status__c ' +
                          'FROM Krow__Project__c ' +
                          'WHERE Id = :projectId LIMIT 1';
            
            List<SObject> projects = Database.query(query);
            
            if (!projects.isEmpty()) {
                SObject proj = projects[0];
                result.put('Id', proj.get('Id'));
                result.put('Name', proj.get('Name'));
                result.put('Status', proj.get('Krow__Project_Status__c'));
            }
        } catch (Exception e) {
            System.debug('Error querying Klient project: ' + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * @description Check if a project already has a capability map
     * @param projectId The project ID to check
     * @return Boolean True if map exists
     */
    @AuraEnabled(cacheable=true)
    public static Boolean hasCapabilityMap(Id projectId) {
        if (projectId == null) {
            return false;
        }
        return [SELECT COUNT() FROM Capability_Map__c WHERE Krow_Project__c = :projectId ] > 0;
    }
}
