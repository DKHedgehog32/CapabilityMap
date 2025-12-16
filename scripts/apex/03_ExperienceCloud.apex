// Experience Cloud Template
Capability_Template__c t = new Capability_Template__c(
    Template_Name__c = 'Experience Cloud',
    Description__c = 'Portals & communities',
    Cloud_Category__c = 'Core CRM',
    Icon_Name__c = '🌐',
    Is_Active__c = true,
    Is_Standard__c = true,
    Version__c = '1.0'
);
insert t;

List<Capability_Template_Category__c> cats = new List<Capability_Template_Category__c>{
    new Capability_Template_Category__c(Name='Site Management', Capability_Template__c=t.Id, Sort_Order__c=1),
    new Capability_Template_Category__c(Name='Customer Portal', Capability_Template__c=t.Id, Sort_Order__c=2),
    new Capability_Template_Category__c(Name='Partner Portal', Capability_Template__c=t.Id, Sort_Order__c=3),
    new Capability_Template_Category__c(Name='Community Features', Capability_Template__c=t.Id, Sort_Order__c=4),
    new Capability_Template_Category__c(Name='Authentication', Capability_Template__c=t.Id, Sort_Order__c=5, Is_Subcategory__c=true)
};
insert cats;

List<Capability_Template_Item__c> items = new List<Capability_Template_Item__c>();
items.add(new Capability_Template_Item__c(Name='Site Builder', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Templates', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Themes & Branding', Capability_Template_Category__c=cats[0].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Self-Service Portal', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Case Management', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Knowledge Access', Capability_Template_Category__c=cats[1].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Deal Registration', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Lead Distribution', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Partner Onboarding', Capability_Template_Category__c=cats[2].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Discussion Forums', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Groups', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Reputation', Capability_Template_Category__c=cats[3].Id, Sort_Order__c=3, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='Login & Registration', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=1, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='SSO Integration', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=2, Default_Size__c='TBD'));
items.add(new Capability_Template_Item__c(Name='MFA', Capability_Template_Category__c=cats[4].Id, Sort_Order__c=3, Default_Size__c='TBD'));
insert items;
System.debug('Experience Cloud created: ' + items.size() + ' capabilities');
