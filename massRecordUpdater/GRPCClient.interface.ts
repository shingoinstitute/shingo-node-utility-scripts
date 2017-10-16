import { IJSONObjectMessage } from './JSONObjectMessage.interface'
import { IRecordsRequestMessage } from './RecordsRequestMessage.interface'
import { IQueryRequestMessage } from './QueryRequestMessage.interface'

export interface IGRPCClient { updateAsync(IRecordsRequestMessage):IJSONObjectMessage, queryAsync(IQueryRequestMessage): IJSONObjectMessage}