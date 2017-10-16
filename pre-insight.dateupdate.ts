import * as grpc from 'grpc';
import { promisifyAll } from 'bluebird';
import { IGRPCClient, MassRecordsUpdater, IJSONObjectMessage } from './massRecordUpdater'

const protoFile = './sf_services.proto';

const sf = grpc.load(protoFile).sfservices;

const client: IGRPCClient = promisifyAll(new sf.SalesforceMicroservices('172.18.0.2:80', grpc.credentials.createInsecure())) as IGRPCClient;

async function updateRecords() {
    const updater = new MassRecordsUpdater('Pre_Insight_Organization__c', ['Id', 'Date_Submitted__c', 'CreatedDate'], client);
    
    updater.update(org => {
        if(!org.Date_Submitted__c) {
            const messageToSend: IJSONObjectMessage = {
                contents: `{ "Id":"${org.Id}", "Date_Submitted__c":"${org.CreatedDate}" }`
            };
            return messageToSend;
        }
    });
}