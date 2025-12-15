/**
 * @description Service for exporting to BPMN format
 * @author Cobra CRM B.V.
 * @date 2024-12-15
 * @version 2.3.0
 */
public with sharing class BPMNExportService {
    
    @AuraEnabled
    public static String exportToBpmn(Id mapId) {
        Map<String, Object> mapData = CapabilityMapController.getMapWithData(mapId);
        Capability_Map__c capMap = (Capability_Map__c)mapData.get('map');
        List<Capability_Category__c> categories = (List<Capability_Category__c>)mapData.get('categories');
        List<Capability__c> capabilities = (List<Capability__c>)mapData.get('capabilities');
        
        // Build BPMN XML
        String bpmn = '<?xml version="1.0" encoding="UTF-8"?>\n';
        bpmn += '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">\n';
        bpmn += '  <bpmn:process id="CapabilityMap_' + capMap.Id + '" name="' + escapeXml(capMap.Name) + '">\n';
        
        for (Capability_Category__c cat : categories) {
            bpmn += '    <bpmn:subProcess id="cat_' + cat.Id + '" name="' + escapeXml(cat.Name) + '">\n';
            
            for (Capability__c cap : capabilities) {
                if (cap.Capability_Category__c == cat.Id) {
                    bpmn += '      <bpmn:task id="cap_' + cap.Id + '" name="' + escapeXml(cap.Name) + '">\n';
                    bpmn += '        <bpmn:documentation>Size: ' + cap.Size__c + ', Phase: ' + cap.Phase__c + ', Hours: ' + cap.Estimated_Hours__c + '</bpmn:documentation>\n';
                    bpmn += '      </bpmn:task>\n';
                }
            }
            
            bpmn += '    </bpmn:subProcess>\n';
        }
        
        bpmn += '  </bpmn:process>\n';
        bpmn += '</bpmn:definitions>';
        
        return bpmn;
    }
    
    private static String escapeXml(String text) {
        if (text == null) return '';
        return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;');
    }
}
