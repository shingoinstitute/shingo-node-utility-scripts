import * as grpc from 'grpc';
import { promisifyAll } from 'bluebird';
import { IGRPCClient, MassRecordsUpdater, IJSONObjectMessage } from './massRecordUpdater'

const protoFile = './sf_services.proto';

const sf = grpc.load(protoFile).sfservices;

const client: IGRPCClient = promisifyAll(new sf.SalesforceMicroservices('172.18.0.2:80', grpc.credentials.createInsecure())) as IGRPCClient;

async function updateRecords() {
    const stateAbb = 'UT'       // <=== Change ME!
    const stateFull = 'Utah'   // <=== Change ME!
    const updater = new MassRecordsUpdater('Contact', ['Id', 'MailingState'], client, `MailingState='${stateAbb}'`);
    
    await updater.update(org => {
        if(org.MailingState === stateAbb) {
            const messageToSend: IJSONObjectMessage = {
                contents: `{ "Id":"${org.Id}", "MailingState":"${stateFull}" }`
            };
            return messageToSend;
        } else {
            return null;
        }
    });
}

updateRecords()
    .then(() => console.log('Records Updated'))
    .catch(err => console.error('Error: ', err))