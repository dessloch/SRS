public with sharing class UtilityDataTableController {
    // these are for tests
    public static final String SOBJECT_NAME = 'Case';
    public static final String FIELDS = 'CaseNumber, Reason, OwnerId';
    public static final String FILTERING = 'Reason != null';
    public static final String SORTING = 'CaseNumber ASC';
    public static final String CONFIG_NAME = 'TestCaseConfig';

    @AuraEnabled
    public static List<SObject> getRecords(String fieldNames, String sObjectApiName, String filter, String sortingParams, Integer limitSize, Integer offset) {
        Boolean isExtended = (limitSize != null && offset != null);
        String queryTemplate = 'SELECT {0} FROM {1} WHERE {2} {3}';
        if (isExtended) {
            queryTemplate += ' LIMIT {4} OFFSET {5}';
        }

        List <String> basicParams = new List<String>{
                fieldNames,
                sObjectApiName,
                filter,
                String.isNotBlank(sortingParams) ? 'ORDER BY ' + sortingParams : ''
        };

        List <String> extendedParams = new List<String>();
        if (isExtended) {
            extendedParams.addAll(basicParams);
            extendedParams.addAll(new List<String>{
                    String.valueOf(limitSize), String.valueOf(offset)
            });
        }

        String query = String.format(queryTemplate, isExtended ? extendedParams : basicParams);
        System.debug('DATATABLE QUERY: ' + query);
        try {
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage() + '\n' + e.getStackTraceString());
        }
    }

    @AuraEnabled
    public static UtilityTableConfiguration__mdt getCustomSettingConfig(String customSettingName) {
        if (Test.isRunningTest()) {
            return new UtilityTableConfiguration__mdt (
                    sObjectAPIName__c = SOBJECT_NAME,
                    FieldAPINames__c = FIELDS,
                    FilteringString__c = FILTERING,
                    SortingString__c = SORTING,
                    DeveloperName = CONFIG_NAME
            );
        }
        UtilityTableConfiguration__mdt setting = [
                SELECT FieldAPINames__c, sObjectAPIName__c,FilteringString__c, SortingString__c, ColumnsConfiguration__c
                FROM UtilityTableConfiguration__mdt
                WHERE DeveloperName = :customSettingName
                LIMIT 1
        ];
        return setting;
    }
}