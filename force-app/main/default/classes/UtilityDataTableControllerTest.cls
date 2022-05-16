@IsTest
public class UtilityDataTableControllerTest {
    private static final String MDT_ERROR = 'Wrong metadata returned!';
    private static final String CASE_REASON = 'Installation';

    @TestSetup
    private static void setup() {
        insert new Case (
                OwnerId = UserInfo.getUserId(),
                Reason = CASE_REASON
        );

        insert new Case (
                OwnerId = UserInfo.getUserId()
        );
    }

    @IsTest
    private static void testGetCustomSettingConfig() {
        Test.startTest();
        UtilityTableConfiguration__mdt mdt =  UtilityDataTableController.getCustomSettingConfig('TestCaseConfig');
        Test.stopTest();
        System.assertEquals(UtilityDataTableController.SOBJECT_NAME, mdt.sObjectAPIName__c, MDT_ERROR);
        System.assertEquals(UtilityDataTableController.CONFIG_NAME, mdt.DeveloperName, MDT_ERROR);
    }

    @IsTest
    private static void testGetRecords() {
        doTest(null, null);
    }

    @IsTest
    private static void testGetRecordsLazy() {
        doTest(10, 0);
    }

    private static void doTest(Integer limitSize, Integer offset) {
        Test.startTest();
        List<SObject> records = UtilityDataTableController.getRecords
                (
                        UtilityDataTableController.FIELDS,
                        UtilityDataTableController.SOBJECT_NAME,
                        UtilityDataTableController.FILTERING,
                        UtilityDataTableController.SORTING,
                        10,
                        0
                );
        Test.stopTest();
        System.assertEquals(1, records.size());
        System.assertEquals(2, [SELECT Id FROM Case].size());
    }
}