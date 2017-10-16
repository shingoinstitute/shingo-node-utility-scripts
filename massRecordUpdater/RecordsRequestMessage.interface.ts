import { IJSONObjectMessage } from './JSONObjectMessage.interface';

export interface IRecordsRequestMessage {
    object: string,
    records: Array<IJSONObjectMessage>
}