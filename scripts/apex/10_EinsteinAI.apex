// Einstein AI Template
Capability_Template__c t = new Capability_Template__c(
    Template_Name__c = 'Einstein AI',
    Description__c = 'AI & machine learning',
    Cloud_Category__c = 'Platform & Integration',
    Icon_Name__c = '🤖',
    Is_Active__c = true,
    Is_Standard__c = true,
    Version__c = '1.0'
);
insert t;

List<Capability_Template_Category__c> cats = new List<Capability_Template_Category__c>{
    new Capability_Template_Category__c(Name='Einstein GPT', Capability_Template__c=t.Id, Sort_Order__c=1),
    new Capability_Template_Category__c(Name='Predictions', Capability_Template__c=t.Id, Sort_Order__c=2),
    new Capability_Template_Category__c(Name='Bots & Agents', Capability_Template__c=t.Id, Sort_Order__c=3),
    new Capability_Template_Category__c(Name='Einstein Vision', Capability_Template__c=t.Id, Sort_Order__c=4)
};
insert cats;

List<Capability_Template_Item__c> items = new List<Capability_Template_Item__c>();
items.add(new Capability_Template_Item__c(Name='Einstein Copilot', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Sales GPT', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Service GPT', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Prompt Builder', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=4, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Lead Scoring', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Opportunity Scoring', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Prediction Builder', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Einstein Bots', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Agentforce', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Agent Builder', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Image Recognition', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Object Detection', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=2, Default_Size__c='TBD'));
insert items;
System.debug('Einstein AI created: ' + items.size() + ' capabilities');
