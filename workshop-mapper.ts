import * as grpc from 'grpc';
import { promisifyAll } from 'bluebird';
import { IGRPCClient, IJSONObjectMessage } from './massRecordUpdater'
import { IAuthGRPCClient } from './workshop-to-v2-mapper/AuthGRPCClient.interface';
import { WorkshopMapper } from './workshop-to-v2-mapper/WorkshopMapper';

const sfProtoFile = './sf_services.proto';
const authProtoFile = './auth_services.proto';

const sf = grpc.load(sfProtoFile).sfservices;
const auth = grpc.load(authProtoFile).authservices;

const sfClient: IGRPCClient = promisifyAll(new sf.SalesforceMicroservices('172.18.0.8:80', grpc.credentials.createInsecure())) as IGRPCClient;
const authClient: IAuthGRPCClient = promisifyAll(new auth.AuthServices('172.18.0.9:80', grpc.credentials.createInsecure())) as IAuthGRPCClient;

const mapper = new WorkshopMapper(sfClient, authClient);

mapper.mapDemWorkshops().then(() => console.log('Dem Mapped')).catch((err) => console.log('Dem not mapped', err));
