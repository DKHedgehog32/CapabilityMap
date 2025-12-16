// Revenue Cloud (CPQ) Template
Capability_Template__c t = new Capability_Template__c(
    Template_Name__c = 'Revenue Cloud',
    Description__c = 'Quote-to-cash & CPQ',
    Cloud_Category__c = 'Revenue & CPQ',
    Icon_Name__c = '💰',
    Is_Active__c = true,
    Is_Standard__c = true,
    Version__c = '1.0'
);
insert t;

List<Capability_Template_Category__c> cats = new List<Capability_Template_Category__c>{
    new Capability_Template_Category__c(Name='Product Catalog', Capability_Template__c=t.Id, Sort_Order__c=1),
    new Capability_Template_Category__c(Name='Configuration', Capability_Template__c=t.Id, Sort_Order__c=2),
    new Capability_Template_Category__c(Name='Pricing', Capability_Template__c=t.Id, Sort_Order__c=3),
    new Capability_Template_Category__c(Name='Quoting', Capability_Template__c=t.Id, Sort_Order__c=4),
    new Capability_Template_Category__c(Name='Contracts', Capability_Template__c=t.Id, Sort_Order__c=5)
};
insert cats;

List<Capability_Template_Item__c> items = new List<Capability_Template_Item__c>();
items.add(new Capability_Template_Item__c(Name='Product Management', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Price Books', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Product Bundles', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Product Configuration', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Guided Selling', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Validation Rules', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Price Rules', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Discount Schedules', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Volume Pricing', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Quote Generation', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Quote Templates', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Quote Approvals', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='E-Signature', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=4, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Contract Management', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Amendments', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Renewals', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=3, Default_Size__c='TBD'));
insert items;
System.debug('Revenue Cloud created: ' + items.size() + ' capabilities');
