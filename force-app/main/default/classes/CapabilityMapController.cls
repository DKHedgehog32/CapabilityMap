/**
 * @description    Controller for Capability Map operations
 *                 Supports both Klient-linked and standalone maps
 * 
 * @author         Cobra CRM B.V.
 * @date           2024-12-15
 * @version        2.3.2
 * 
 * CHANGELOG:
 * 2024-12-15 - v2.3.0 - Initial creation with streamlined architecture
 * 2024-12-15 - v2.3.2 - Added support for standalone maps without Klient
 */
public with sharing class CapabilityMapController {
    
    /**
     * @description Get capability map by Klient Project ID
     * @param projectId The Klient Project ID
     * @return Capability_Map__c The capability map or null
     */
    @AuraEnabled(cacheable=true)
    public static Capability_Map__c getMapByProject(Id projectId) {
        if (projectId == null) {
            return null;
        }
        
        List<Capability_Map__c> maps = [
            SELECT Id, Name, Status__c, Last_Saved__c, Auto_Save_Enabled__c,
                   XS_Hours__c, S_Hours__c, M_Hours__c, L_Hours__c,
                   XL_Hours__c, XXL_Hours__c, XXXL_Hours__c,
                   Krow_Project__c
            FROM Capability_Map__c
            WHERE Krow_Project__c = :projectId
            
            LIMIT 1
        ];
        return maps.isEmpty() ? null : maps[0];
    }
    
    /**
     * @description Get all capability maps for the user (standalone maps)
     * @return List<Capability_Map__c> All accessible maps
     */
    @AuraEnabled(cacheable=true)
    public static List<Capability_Map__c> getMyMaps() {
        return [
            SELECT Id, Name, Status__c, Last_Saved__c, CreatedDate
            FROM Capability_Map__c
            WHERE CreatedById = :UserInfo.getUserId()
            
            ORDER BY LastModifiedDate DESC
            LIMIT 50
        ];
    }
    
    /**
     * @description Create a new capability map (with or without project)
     * @param projectId The Klient Project ID (can be null for standalone)
     * @param mapName The name for the new map
     * @return Capability_Map__c The created map
     */
    @AuraEnabled
    public static Capability_Map__c createMap(Id projectId, String mapName) {
        // Check if map already exists for this project (only if project specified)
        if (projectId != null) {
            List<Capability_Map__c> existing = [
                SELECT Id FROM Capability_Map__c 
                WHERE Krow_Project__c = :projectId 
                 
                LIMIT 1
            ];
            if (!existing.isEmpty()) {
                throw new AuraHandledException('A capability map already exists for this project');
            }
        }
        
        Capability_Map__c newMap = new Capability_Map__c(
            Name = mapName,
            Status__c = 'Draft',
            XS_Hours__c = 2,
            S_Hours__c = 4,
            M_Hours__c = 8,
            L_Hours__c = 16,
            XL_Hours__c = 32,
            XXL_Hours__c = 64,
            XXXL_Hours__c = 128
        );
        
        // Only set project if provided
        if (projectId != null) {
            newMap.Krow_Project__c = projectId;
        }
        
        insert newMap;
        return newMap;
    }
    
    /**
     * @description Save the capability map (update Last_Saved__c)
     * @param mapId The map ID to save
     * @return Capability_Map__c The updated map
     */
    @AuraEnabled
    public static Capability_Map__c saveMap(Id mapId) {
        Capability_Map__c mapToSave = new Capability_Map__c(
            Id = mapId,
            Last_Saved__c = System.now()
        );
        update mapToSave;
        return getMapById(mapId);
    }
    
    /**
     * @description Get capability map by ID with all related data
     * @param mapId The map ID
     * @return Map<String, Object> Complete map data
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getMapWithData(Id mapId) {
        Map<String, Object> result = new Map<String, Object>();
        
        // Get map
        Capability_Map__c capMap = getMapById(mapId);
        result.put('map', capMap);
        
        // Get categories
        List<Capability_Category__c> categories = [
            SELECT Id, Name, Sort_Order__c, Is_Subcategory__c, ArchiMate_Id__c
            FROM Capability_Category__c
            WHERE Capability_Map__c = :mapId
            
            ORDER BY Sort_Order__c
        ];
        result.put('categories', categories);
        
        // Get capabilities
        List<Capability__c> capabilities = [
            SELECT Id, Name, Size__c, Phase__c, Sort_Order__c, Color__c,
                   Calculated_Hours__c, Hours_Override__c, Description__c,
                   Capability_Category__c, ArchiMate_Id__c
            FROM Capability__c
            WHERE Capability_Category__r.Capability_Map__c = :mapId
            
            ORDER BY Capability_Category__c, Sort_Order__c
        ];
        result.put('capabilities', capabilities);
        
        // Get roles
        List<Capability_Role__c> roles = [
            SELECT Id, Name, Hourly_Rate__c, Color__c, Sort_Order__c
            FROM Capability_Role__c
            WHERE Capability_Map__c = :mapId
            
            ORDER BY Sort_Order__c
        ];
        result.put('roles', roles);
        
        // Get role assignments
        List<Capability_Role_Assignment__c> assignments = [
            SELECT Id, Capability__c, Capability_Role__c, 
                   Allocation_Percent__c, Allocated_Hours__c
            FROM Capability_Role_Assignment__c
            WHERE Capability__r.Capability_Category__r.Capability_Map__c = :mapId
            
        ];
        result.put('roleAssignments', assignments);
        
        // Get applied templates
        List<Capability_Map_Template__c> appliedTemplates = [
            SELECT Id, Capability_Template__c, Capability_Template__r.Template_Name__c,
                   Applied_Date__c, Applied_By__r.Name
            FROM Capability_Map_Template__c
            WHERE Capability_Map__c = :mapId
            
            ORDER BY Applied_Date__c DESC
        ];
        result.put('appliedTemplates', appliedTemplates);
        
        // Get custom phase colors
        List<Phase_Color__c> phaseColors = [
            SELECT Id, Name, Color__c, Sort_Order__c
            FROM Phase_Color__c
            WHERE Capability_Map__c = :mapId
            ORDER BY Sort_Order__c
        ];
        result.put('phaseColors', phaseColors);
        
        return result;
    }
    
    /**
     * @description Update hours configuration for a map
     * @param mapId The map ID
     * @param hoursConfig Map of size to hours
     * @return Capability_Map__c Updated map
     */
    @AuraEnabled
    public static Capability_Map__c updateHoursConfig(Id mapId, Map<String, Integer> hoursConfig) {
        Capability_Map__c mapToUpdate = new Capability_Map__c(Id = mapId);
        
        if (hoursConfig.containsKey('XS')) mapToUpdate.XS_Hours__c = hoursConfig.get('XS');
        if (hoursConfig.containsKey('S')) mapToUpdate.S_Hours__c = hoursConfig.get('S');
        if (hoursConfig.containsKey('M')) mapToUpdate.M_Hours__c = hoursConfig.get('M');
        if (hoursConfig.containsKey('L')) mapToUpdate.L_Hours__c = hoursConfig.get('L');
        if (hoursConfig.containsKey('XL')) mapToUpdate.XL_Hours__c = hoursConfig.get('XL');
        if (hoursConfig.containsKey('XXL')) mapToUpdate.XXL_Hours__c = hoursConfig.get('XXL');
        if (hoursConfig.containsKey('XXXL')) mapToUpdate.XXXL_Hours__c = hoursConfig.get('XXXL');
        
        update mapToUpdate;
        return getMapById(mapId);
    }
    
    /**
     * @description Clone a capability map to a new project
     * @param sourceMapId The source map ID
     * @param targetProjectId The target project ID (can be null)
     * @param newMapName The name for the cloned map
     * @return Capability_Map__c The cloned map
     */
    @AuraEnabled
    public static Capability_Map__c cloneMap(Id sourceMapId, Id targetProjectId, String newMapName) {
        // Get source map with all data
        Map<String, Object> sourceData = getMapWithData(sourceMapId);
        Capability_Map__c sourceMap = (Capability_Map__c)sourceData.get('map');
        
        // Create new map
        Capability_Map__c newMap = createMap(targetProjectId, newMapName);
        newMap.XS_Hours__c = sourceMap.XS_Hours__c;
        newMap.S_Hours__c = sourceMap.S_Hours__c;
        newMap.M_Hours__c = sourceMap.M_Hours__c;
        newMap.L_Hours__c = sourceMap.L_Hours__c;
        newMap.XL_Hours__c = sourceMap.XL_Hours__c;
        newMap.XXL_Hours__c = sourceMap.XXL_Hours__c;
        newMap.XXXL_Hours__c = sourceMap.XXXL_Hours__c;
        update newMap;
        
        // Clone categories and capabilities
        Map<Id, Id> categoryIdMap = new Map<Id, Id>();
        List<Capability_Category__c> sourceCategories = (List<Capability_Category__c>)sourceData.get('categories');
        
        for (Capability_Category__c sourceCat : sourceCategories) {
            Capability_Category__c newCat = new Capability_Category__c(
                Name = sourceCat.Name,
                Capability_Map__c = newMap.Id,
                Sort_Order__c = sourceCat.Sort_Order__c,
                Is_Subcategory__c = sourceCat.Is_Subcategory__c
            );
            insert newCat;
            categoryIdMap.put(sourceCat.Id, newCat.Id);
        }
        
        // Clone capabilities
        List<Capability__c> sourceCapabilities = (List<Capability__c>)sourceData.get('capabilities');
        for (Capability__c sourceCap : sourceCapabilities) {
            Capability__c newCap = new Capability__c(
                Name = sourceCap.Name,
                Capability_Category__c = categoryIdMap.get(sourceCap.Capability_Category__c),
                Size__c = sourceCap.Size__c,
                Phase__c = sourceCap.Phase__c,
                Sort_Order__c = sourceCap.Sort_Order__c,
                Hours_Override__c = sourceCap.Hours_Override__c,
                Description__c = sourceCap.Description__c
            );
            insert newCap;
        }
        
        return newMap;
    }
    
    /**
     * @description Save phase colors for a map
     * @param mapId The map ID
     * @param phaseColors List of phase color objects with Name and Color__c
     */
    @AuraEnabled
    public static void savePhaseColors(Id mapId, List<Map<String, Object>> phaseColors) {
        // Delete existing phase colors for this map
        delete [SELECT Id FROM Phase_Color__c WHERE Capability_Map__c = :mapId];
        
        // Insert new phase colors
        if (phaseColors != null && !phaseColors.isEmpty()) {
            List<Phase_Color__c> toInsert = new List<Phase_Color__c>();
            Integer sortOrder = 1;
            
            for (Map<String, Object> pc : phaseColors) {
                toInsert.add(new Phase_Color__c(
                    Name = (String)pc.get('name'),
                    Color__c = (String)pc.get('color'),
                    Sort_Order__c = sortOrder++,
                    Capability_Map__c = mapId
                ));
            }
            
            insert toInsert;
        }
    }
    
    /**
     * @description Get phase colors for a map
     * @param mapId The map ID
     * @return List of phase colors
     */
    @AuraEnabled(cacheable=true)
    public static List<Phase_Color__c> getPhaseColors(Id mapId) {
        return [
            SELECT Id, Name, Color__c, Sort_Order__c
            FROM Phase_Color__c
            WHERE Capability_Map__c = :mapId
            ORDER BY Sort_Order__c
        ];
    }
    
    // Private helper method
    private static Capability_Map__c getMapById(Id mapId) {
        List<Capability_Map__c> maps = [
            SELECT Id, Name, Status__c, Last_Saved__c, Auto_Save_Enabled__c,
                   XS_Hours__c, S_Hours__c, M_Hours__c, L_Hours__c,
                   XL_Hours__c, XXL_Hours__c, XXXL_Hours__c,
                   Krow_Project__c
            FROM Capability_Map__c
            WHERE Id = :mapId
            
            LIMIT 1
        ];
        return maps.isEmpty() ? null : maps[0];
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * Get user's favorite and recently accessed maps
     * ─────────────────────────────────────────────────────────────────────────
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getMyFavorites() {
        Id currentUserId = UserInfo.getUserId();
        List<Map<String, Object>> results = new List<Map<String, Object>>();
        
        // Get user's map accesses, ordered by favorites first, then last accessed
        List<Map_User_Access__c> accesses = [
            SELECT Id, Capability_Map__c, Capability_Map__r.Name, 
                   Capability_Map__r.Status__c, Capability_Map__r.Last_Saved__c,
                   Is_Favorite__c, Last_Accessed__c, Access_Count__c
            FROM Map_User_Access__c
            WHERE User__c = :currentUserId
              AND Capability_Map__c != null
            ORDER BY Is_Favorite__c DESC, Last_Accessed__c DESC
            LIMIT 10
        ];
        
        for (Map_User_Access__c access : accesses) {
            Map<String, Object> item = new Map<String, Object>();
            item.put('id', access.Capability_Map__c);
            item.put('accessId', access.Id);
            item.put('name', access.Capability_Map__r.Name);
            item.put('status', access.Capability_Map__r.Status__c);
            item.put('lastSaved', access.Capability_Map__r.Last_Saved__c);
            item.put('isFavorite', access.Is_Favorite__c);
            item.put('lastAccessed', access.Last_Accessed__c);
            item.put('accessCount', access.Access_Count__c);
            results.add(item);
        }
        
        return results;
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * Track user accessing a map (upsert access record)
     * ─────────────────────────────────────────────────────────────────────────
     */
    @AuraEnabled
    public static void trackMapAccess(Id mapId) {
        Id currentUserId = UserInfo.getUserId();
        
        // Check if access record already exists
        List<Map_User_Access__c> existing = [
            SELECT Id, Access_Count__c
            FROM Map_User_Access__c
            WHERE User__c = :currentUserId AND Capability_Map__c = :mapId
            LIMIT 1
        ];
        
        Map_User_Access__c access;
        if (!existing.isEmpty()) {
            // Update existing
            access = existing[0];
            access.Last_Accessed__c = DateTime.now();
            access.Access_Count__c = (access.Access_Count__c == null ? 0 : access.Access_Count__c) + 1;
        } else {
            // Create new
            access = new Map_User_Access__c(
                User__c = currentUserId,
                Capability_Map__c = mapId,
                Last_Accessed__c = DateTime.now(),
                Access_Count__c = 1,
                Is_Favorite__c = false
            );
        }
        
        upsert access;
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * Toggle favorite status for a map
     * ─────────────────────────────────────────────────────────────────────────
     */
    @AuraEnabled
    public static Boolean toggleFavorite(Id mapId) {
        Id currentUserId = UserInfo.getUserId();
        
        // Find or create access record
        List<Map_User_Access__c> existing = [
            SELECT Id, Is_Favorite__c
            FROM Map_User_Access__c
            WHERE User__c = :currentUserId AND Capability_Map__c = :mapId
            LIMIT 1
        ];
        
        Map_User_Access__c access;
        Boolean newFavoriteStatus;
        
        if (!existing.isEmpty()) {
            access = existing[0];
            access.Is_Favorite__c = !access.Is_Favorite__c;
            newFavoriteStatus = access.Is_Favorite__c;
        } else {
            access = new Map_User_Access__c(
                User__c = currentUserId,
                Capability_Map__c = mapId,
                Last_Accessed__c = DateTime.now(),
                Access_Count__c = 0,
                Is_Favorite__c = true
            );
            newFavoriteStatus = true;
        }
        
        upsert access;
        return newFavoriteStatus;
    }
}