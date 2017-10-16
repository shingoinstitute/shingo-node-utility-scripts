import { IJSONObjectMessage } from './JSONObjectMessage.interface'
import { IRecordsRequestMessage } from './RecordsRequestMessage.interface'
import { IQueryRequestMessage } from './QueryRequestMessage.interface'
import { IUpdateHandler } from './UpdateHandler.interface'
import { ISFQueryResponse } from './SFQueryResponse.interface'
import { IGRPCClient } from './GRPCClient.interface'
import * as ProgressBar from 'progress'

export class MassRecordsUpdater {

    constructor(private sfObject: string, private fieldsToQuery: Array<string>, private client: IGRPCClient, private clauses: string = '') {};

    public async update(handler: IUpdateHandler): Promise<string> {
        //First, query records
        const records = (await this.queryRecords()).records;
        const messagesToSend = new Array<IJSONObjectMessage>();

        let progressBar = new ProgressBar(' Processing [:bar] :percent', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: records.length
        })

        console.log(`Updating ${records.length} records...`)
        //For each record in records
        for (let record of records) {
            //Handler.handle
            const messageToSend: IJSONObjectMessage = handler(record);
            if(messageToSend) messagesToSend.push(messageToSend);
            progressBar.tick(1);
        }
        //Update records
        await this.updateRecords(messagesToSend);
        return Promise.resolve('Complete!');
    }

    private async queryRecords(): Promise<ISFQueryResponse> {
        const query: IQueryRequestMessage = {
            action: 'SELECT',
            fields: this.fieldsToQuery,
            table: this.sfObject,
            clauses: this.clauses
        }
        const queryResponseMessage: IJSONObjectMessage  = await this.client.queryAsync(query);
        return Promise.resolve(JSON.parse(queryResponseMessage.contents) as ISFQueryResponse);
    }

    private async updateRecords(records: Array<IJSONObjectMessage>) {
        if(!records.length) return Promise.reject('No records to update!');

        let progressBar = new ProgressBar(' Updating [:bar] :percent', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: records.length
        })

        for(let record of records){
            let updateRecordRequest : IRecordsRequestMessage = {
                object: this.sfObject,
                records: [record]
            };
            const updateResponseMessage: IJSONObjectMessage = await this.client.updateAsync(updateRecordRequest); // REST POST -> salesforce.com
            progressBar.tick(1);
        }       
        return Promise.resolve();
    }
}