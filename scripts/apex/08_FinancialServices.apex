// Financial Services Cloud Template
Capability_Template__c t = new Capability_Template__c(
    Template_Name__c = 'Financial Services Cloud',
    Description__c = 'Banking & wealth management',
    Cloud_Category__c = 'Industry Clouds',
    Icon_Name__c = '🏦',
    Is_Active__c = true,
    Is_Standard__c = true,
    Version__c = '1.0'
);
insert t;

List<Capability_Template_Category__c> cats = new List<Capability_Template_Category__c>{
    new Capability_Template_Category__c(Name='Client Management', Capability_Template__c=t.Id, Sort_Order__c=1),
    new Capability_Template_Category__c(Name='Financial Accounts', Capability_Template__c=t.Id, Sort_Order__c=2),
    new Capability_Template_Category__c(Name='Wealth Management', Capability_Template__c=t.Id, Sort_Order__c=3),
    new Capability_Template_Category__c(Name='Banking', Capability_Template__c=t.Id, Sort_Order__c=4),
    new Capability_Template_Category__c(Name='Compliance', Capability_Template__c=t.Id, Sort_Order__c=5, Is_Subcategory__c=true)
};
insert cats;

List<Capability_Template_Item__c> items = new List<Capability_Template_Item__c>();
items.add(new Capability_Template_Item__c(Name='Client 360', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Household Management', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Relationship Groups', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Account Overview', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Account Aggregation', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Transaction History', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Financial Goals', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Investment Portfolio', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Asset Allocation', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Loan Origination', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Credit Applications', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Branch Management', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='KYC/AML', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Regulatory Reporting', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Complaint Management', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=3, Default_Size__c='TBD'));
insert items;
System.debug('Financial Services Cloud created: ' + items.size() + ' capabilities');
