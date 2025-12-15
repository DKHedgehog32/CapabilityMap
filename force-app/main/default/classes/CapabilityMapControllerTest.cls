/**
 * @description Test class for CapabilityMapController and related classes
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
@isTest
private class CapabilityMapControllerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test project (mock Klient project)
        // Note: In real implementation, create actual Krow__Project__c record
    }
    
    @isTest
    static void testCreateAndGetMap() {
        // Create a mock project ID (in real test, use actual Krow__Project__c)
        // For now, we'll test the controller methods that don't require Klient
        
        Test.startTest();
        
        // Test getActiveTemplates
        List<Capability_Template__c> templates = CapabilityTemplateController.getActiveTemplates();
        System.assertNotEquals(null, templates, 'Templates list should not be null');
        
        Test.stopTest();
    }
    
    @isTest
    static void testTemplateOperations() {
        Test.startTest();
        
        // Create a template
        Capability_Template__c template = TemplateAdminService.createTemplate(
            'Test Template',
            'Core CRM',
            'Test Description'
        );
        System.assertNotEquals(null, template.Id, 'Template should be created');
        
        // Add category to template
        Capability_Template_Category__c category = TemplateAdminService.addTemplateCategory(
            template.Id,
            'Test Category',
            1
        );
        System.assertNotEquals(null, category.Id, 'Category should be created');
        
        // Add item to category
        Capability_Template_Item__c item = TemplateAdminService.addTemplateItem(
            category.Id,
            'Test Item',
            'M',
            1
        );
        System.assertNotEquals(null, item.Id, 'Item should be created');
        
        // Get template with items
        Map<String, Object> templateData = CapabilityTemplateController.getTemplateWithItems(template.Id);
        System.assertNotEquals(null, templateData, 'Template data should not be null');
        
        // Clone template
        Capability_Template__c clonedTemplate = TemplateAdminService.cloneTemplate(
            template.Id,
            'Cloned Template'
        );
        System.assertNotEquals(null, clonedTemplate.Id, 'Cloned template should be created');
        
        Test.stopTest();
    }
    
    @isTest
    static void testCategoryOperations() {
        // Create template first
        Capability_Template__c template = new Capability_Template__c(
            Template_Name__c = 'Test',
            Cloud_Category__c = 'Core CRM',
            Version__c = '1.0',
            Is_Active__c = true
        );
        insert template;
        
        // Create a map (without Klient project for this test)
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2,
            S_Hours__c = 4,
            M_Hours__c = 8,
            L_Hours__c = 16,
            XL_Hours__c = 32,
            XXL_Hours__c = 64,
            XXXL_Hours__c = 128
        );
        insert testMap;
        
        Test.startTest();
        
        // Create category
        Capability_Category__c category = CapabilityCategoryController.createCategory(
            testMap.Id,
            'Test Category',
            false
        );
        System.assertNotEquals(null, category.Id, 'Category should be created');
        
        // Update category
        Capability_Category__c updatedCategory = CapabilityCategoryController.updateCategory(
            category.Id,
            'Updated Category',
            true
        );
        System.assertEquals('Updated Category', updatedCategory.Name, 'Category name should be updated');
        
        // Get categories
        List<Capability_Category__c> categories = CapabilityCategoryController.getCategoriesByMap(testMap.Id);
        System.assertEquals(1, categories.size(), 'Should have 1 category');
        
        Test.stopTest();
    }
    
    @isTest
    static void testCapabilityOperations() {
        // Setup
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2, S_Hours__c = 4, M_Hours__c = 8, L_Hours__c = 16,
            XL_Hours__c = 32, XXL_Hours__c = 64, XXXL_Hours__c = 128
        );
        insert testMap;
        
        Capability_Category__c category = new Capability_Category__c(
            Name = 'Test Category',
            Capability_Map__c = testMap.Id,
            Sort_Order__c = 1
        );
        insert category;
        
        Test.startTest();
        
        // Create capability
        Capability__c capability = CapabilityController.createCapability(
            category.Id,
            'Test Capability',
            'M',
            'Phase 1'
        );
        System.assertNotEquals(null, capability.Id, 'Capability should be created');
        
        // Update capability
        Map<String, Object> updateFields = new Map<String, Object>{
            'Name' => 'Updated Capability',
            'Size__c' => 'L',
            'Phase__c' => 'Phase 2'
        };
        Capability__c updatedCap = CapabilityController.updateCapability(capability.Id, updateFields);
        System.assertEquals('Updated Capability', updatedCap.Name, 'Name should be updated');
        
        // Get capabilities
        List<Capability__c> capabilities = CapabilityController.getCapabilitiesByCategory(category.Id);
        System.assertEquals(1, capabilities.size(), 'Should have 1 capability');
        
        // Bulk update
        List<Id> capIds = new List<Id>{ capability.Id };
        Map<String, Object> bulkFields = new Map<String, Object>{ 'Phase__c' => 'Phase 3' };
        CapabilityController.bulkUpdateCapabilities(capIds, bulkFields);
        
        Test.stopTest();
    }
    
    @isTest
    static void testRoleOperations() {
        // Setup
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2, S_Hours__c = 4, M_Hours__c = 8, L_Hours__c = 16,
            XL_Hours__c = 32, XXL_Hours__c = 64, XXXL_Hours__c = 128
        );
        insert testMap;
        
        Test.startTest();
        
        // Create role
        Capability_Role__c role = CapabilityRoleController.createRole(
            testMap.Id,
            'Consultant',
            150.00,
            '#0176d3'
        );
        System.assertNotEquals(null, role.Id, 'Role should be created');
        
        // Update role
        Capability_Role__c updatedRole = CapabilityRoleController.updateRole(
            role.Id,
            'Senior Consultant',
            175.00,
            '#00a1e0'
        );
        System.assertEquals('Senior Consultant', updatedRole.Name, 'Role name should be updated');
        
        // Get roles
        List<Capability_Role__c> roles = CapabilityRoleController.getRolesByMap(testMap.Id);
        System.assertEquals(1, roles.size(), 'Should have 1 role');
        
        Test.stopTest();
    }
    
    @isTest
    static void testMapLifecycle() {
        // Setup
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2, S_Hours__c = 4, M_Hours__c = 8, L_Hours__c = 16,
            XL_Hours__c = 32, XXL_Hours__c = 64, XXXL_Hours__c = 128
        );
        insert testMap;
        
        Capability_Category__c category = new Capability_Category__c(
            Name = 'Test Category',
            Capability_Map__c = testMap.Id,
            Sort_Order__c = 1
        );
        insert category;
        
        Test.startTest();
        
        // Get statistics
        Map<String, Integer> stats = MapLifecycleService.getMapStatistics(testMap.Id);
        System.assertEquals(1, stats.get('categories'), 'Should have 1 category');
        
        // Clear map
        MapLifecycleService.clearMapContents(testMap.Id);
        
        // Verify cleared
        stats = MapLifecycleService.getMapStatistics(testMap.Id);
        System.assertEquals(0, stats.get('categories'), 'Should have 0 categories after clear');
        
        Test.stopTest();
    }
    
    @isTest
    static void testHoursConfiguration() {
        // Setup
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2, S_Hours__c = 4, M_Hours__c = 8, L_Hours__c = 16,
            XL_Hours__c = 32, XXL_Hours__c = 64, XXXL_Hours__c = 128
        );
        insert testMap;
        
        Test.startTest();
        
        // Update hours config
        Map<String, Integer> newHours = new Map<String, Integer>{
            'XS' => 1,
            'S' => 2,
            'M' => 4,
            'L' => 8,
            'XL' => 16,
            'XXL' => 32,
            'XXXL' => 64
        };
        
        Capability_Map__c updatedMap = CapabilityMapController.updateHoursConfig(testMap.Id, newHours);
        System.assertEquals(1, updatedMap.XS_Hours__c, 'XS hours should be updated');
        System.assertEquals(64, updatedMap.XXXL_Hours__c, 'XXXL hours should be updated');
        
        Test.stopTest();
    }
    
    @isTest
    static void testBPMNExport() {
        // Setup
        Capability_Map__c testMap = new Capability_Map__c(
            Name = 'Test Map',
            Status__c = 'Draft',
            XS_Hours__c = 2, S_Hours__c = 4, M_Hours__c = 8, L_Hours__c = 16,
            XL_Hours__c = 32, XXL_Hours__c = 64, XXXL_Hours__c = 128
        );
        insert testMap;
        
        Capability_Category__c category = new Capability_Category__c(
            Name = 'Test Category',
            Capability_Map__c = testMap.Id,
            Sort_Order__c = 1
        );
        insert category;
        
        Capability__c capability = new Capability__c(
            Name = 'Test Capability',
            Capability_Category__c = category.Id,
            Size__c = 'M',
            Phase__c = 'Phase 1',
            Sort_Order__c = 1
        );
        insert capability;
        
        Test.startTest();
        
        String bpmn = BPMNExportService.exportToBpmn(testMap.Id);
        System.assert(bpmn.contains('Test Map'), 'BPMN should contain map name');
        System.assert(bpmn.contains('Test Category'), 'BPMN should contain category name');
        System.assert(bpmn.contains('Test Capability'), 'BPMN should contain capability name');
        
        Test.stopTest();
    }
}
