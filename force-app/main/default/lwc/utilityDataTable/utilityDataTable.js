import {api, LightningElement} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getRecords from '@salesforce/apex/UtilityDataTableController.getRecords';
import getCustomSettingConfig from '@salesforce/apex/UtilityDataTableController.getCustomSettingConfig';
import {loadStyle} from 'lightning/platformResourceLoader';
import styles from '@salesforce/resourceUrl/printStyle';
import saveAsPDF from '@salesforce/label/c.SaveAsPDF';

export default class UtilityDataTable extends LightningElement {
    label = {saveAsPDF};
    showSpinner = true;

    sObjectApiName;
    fields;
    filteringString;
    sortingString;
    columnsConfig;

    sortBy;
    sortDirection;

    records;
    recordsBuffer;
    recordsLimit = 20;
    recordsOffset = 0;
    totalNumberOfRecords;

    _customSettingName;
    _enableLazyLoading; // this one is for rendering (should not be changed)
    isLazyLoadingEnabled = false; // this one is conditional and stops the lazy loading
    stylesInitialized = false;

    @api set customSettingName(value) {
        this._customSettingName = value;
    }

    get customSettingName() {
        return this._customSettingName;
    }

    @api set enableLazyLoading(value) {
        this._enableLazyLoading = value;
    }

    get enableLazyLoading() {
        return this._enableLazyLoading;
    }

    get fieldsAsArray() {
        return this.fields.split(',').map(field => field.trim());
    }

    get columns() {
        return this.columnsConfig;
    }

    get datatableHeight() { // need this hack due to lwс lazy loading drawback
        if (this.records.length < 8) {
            return 'height: auto;';
        } else {
            return 'height: 300px;';
        }
    }

    async renderedCallback() {
        if (this.stylesInitialized) return;
        try {
            await loadStyle(this, styles + '/print.css');
            this.stylesInitialized = true;
            console.log('Static resource loaded.');
        } catch (error) {
            console.error('Error: ' + error.body.message);
        }
    }

    async connectedCallback() {
        try {
            const {FieldAPINames__c, FilteringString__c, sObjectAPIName__c, SortingString__c, ColumnsConfiguration__c} =
                await getCustomSettingConfig({customSettingName: this.customSettingName});
            this.columnsConfig = JSON.parse(ColumnsConfiguration__c);
            this.sObjectApiName = sObjectAPIName__c;
            this.fields = FieldAPINames__c;
            this.filteringString = FilteringString__c;
            this.sortingString = SortingString__c;
            this.records = await this.getRecordsWithLinks();
            this.showSpinner = false;
        } catch (e) {
            this.showErrorToast(e);
        }
        this.isLazyLoadingEnabled = this.enableLazyLoading;
        this.recordsBuffer = this.records;
    }

    getRecordsWithLinks() {
        return this.fetchRecords().then((records) => this.addRecordLinks(records));
    }

    fetchRecords() {
        let params = {
            fieldNames: this.fields,
            sObjectApiName: this.sObjectApiName,
            filter: this.filteringString,
            sortingParams: this.sortingString,
            limitSize: null,
            offset: null
        };
        if (this.enableLazyLoading) {
            params = {...params, limitSize: this.recordsLimit, offset: this.recordsOffset}
        }
        return getRecords(params);
    }

    addRecordLinks(records) {
        return records.map(row => {
            const urlLink = `/${row.Id}`;
            return {...row, urlLink: urlLink}
        });
    }

    async loadMoreData(event) {
        const {target} = event;
        target.isLoading = true;
        this.recordsOffset = this.recordsOffset + this.recordsLimit;
        const newFetchedRecords = await this.getRecordsWithLinks();
        const currentRecords = this.records;
        this.records = currentRecords.concat(newFetchedRecords);
        if (newFetchedRecords.length === 0) {
            this.isLazyLoadingEnabled = false;
        }
        target.isLoading = false
    }

    handleChange(event) {
        this.records = this.handleSearch(this.recordsBuffer, event.target.value);
        console.log(this.records);
    }

    handleSearch(records, searchKey) {
        return records.filter(record => (
            Object.entries(record).some(([key, value]) =>
                this.fieldsAsArray.includes(key) && (`${value}`.toLowerCase().includes(`${searchKey}`.toLowerCase())
                ))
        ));
    }

    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.invokeSorting(this.sortBy, this.sortDirection);
    }

    invokeSorting(fieldName, direction) {
        this.records = this.sortData(this.records, fieldName, direction);
    }

    sortData(array, fieldName, direction) {
        const getValueByKey = (record) => record[fieldName];
        const isReverse = direction === 'asc' ? 1 : -1;
        const clonedArray = [...array];

        return clonedArray.sort((rec1, rec2) => {
            rec1 = getValueByKey(rec1) ? getValueByKey(rec1) : '';
            rec2 = getValueByKey(rec2) ? getValueByKey(rec2) : '';
            return isReverse * ((rec1 > rec2) - (rec2 > rec1));
        });
    }

    downloadAsPdf() { //haha :)
        try {
            document.execCommand('print', false, null);
        } catch (e) {
            window.print();
        }
    }

    showErrorToast(error) {
        this.dispatchEvent(new ShowToastEvent({
            title: error.statusText || 'Error',
            message: (error.body?.message || error.message || '')?.split('\n')[0],
            variant: 'error'
        }));
    }
}