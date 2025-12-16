// Sales Cloud Template
Capability_Template__c t = new Capability_Template__c(
    Template_Name__c = 'Sales Cloud',
    Description__c = 'Lead-to-cash sales automation',
    Cloud_Category__c = 'Core CRM',
    Icon_Name__c = '💼',
    Is_Active__c = true,
    Is_Standard__c = true,
    Version__c = '1.0'
);
insert t;

List<Capability_Template_Category__c> cats = new List<Capability_Template_Category__c>{
    new Capability_Template_Category__c(Name='Lead Management', Capability_Template__c=t.Id, Sort_Order__c=1),
    new Capability_Template_Category__c(Name='Opportunity Management', Capability_Template__c=t.Id, Sort_Order__c=2),
    new Capability_Template_Category__c(Name='Account & Contact', Capability_Template__c=t.Id, Sort_Order__c=3),
    new Capability_Template_Category__c(Name='Territory Management', Capability_Template__c=t.Id, Sort_Order__c=4),
    new Capability_Template_Category__c(Name='Sales Productivity', Capability_Template__c=t.Id, Sort_Order__c=5),
    new Capability_Template_Category__c(Name='Quoting & Products', Capability_Template__c=t.Id, Sort_Order__c=6, Is_Subcategory__c=true),
    new Capability_Template_Category__c(Name='Analytics', Capability_Template__c=t.Id, Sort_Order__c=7, Is_Subcategory__c=true)
};
insert cats;

List<Capability_Template_Item__c> items = new List<Capability_Template_Item__c>();
items.add(new Capability_Template_Item__c(Name='Lead Capture', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Lead Scoring', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Lead Assignment', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Lead Conversion', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=4, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Pipeline Management', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Stage Tracking', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Forecasting', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Account Hierarchy', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Contact Roles', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Account Teams', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Territory Planning', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Territory Assignment', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Email Integration', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Task Management', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Activity Capture', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Product Catalog', Capability_Template_Category__c=cats[5].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Price Books', Capability_Template_Category__c=cats[5].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Quote Generation', Capability_Template_Category__c=cats[5].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Pipeline Reports', Capability_Template_Category__c=cats[6].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Sales Dashboards', Capability_Template_Category__c=cats[6].Id, Sort_Order__c=2, Default_Size__c='TBD'));
insert items;
System.debug('Sales Cloud created: ' + items.size() + ' capabilities');
