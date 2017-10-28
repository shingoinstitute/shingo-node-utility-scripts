import * as ProgressBar from 'progress';
import { IJSONObjectMessage } from '../massRecordUpdater/JSONObjectMessage.interface'
import { IRecordsRequestMessage } from '../massRecordUpdater/RecordsRequestMessage.interface'
import { IQueryRequestMessage } from '../massRecordUpdater/QueryRequestMessage.interface'
import { IUpdateHandler } from '../massRecordUpdater/UpdateHandler.interface'
import { ISFQueryResponse } from '../massRecordUpdater/SFQueryResponse.interface'
import { IAuthGRPCClient } from './AuthGRPCClient.interface'
import { IGRPCClient as ISFGRPCClient } from '../massRecordUpdater/GRPCClient.interface'
import { IPermission } from './Permission.interface';
import { IWorkshop } from './Workshop.interface';
import { keyBy } from 'lodash';

export class WorkshopMapper {

    private userMap: any;

    constructor(private sf: ISFGRPCClient, private auth: IAuthGRPCClient) { }

    public async mapDemWorkshops() {
        let contacts = await this.queryFacilitators();
        let workshops = (await this.queryWorkshops()) as IWorkshop[];
        let users = await this.auth.getUsersAsync(`user.services like '%affiliate-portal%`);
        this.userMap = keyBy(users, 'extId');
        let roles = await this.auth.getRolesAsync(`role.service='affiliate-portal'`);
        let afMan = roles.filter(role => role.name === 'Affiliate Manager')[0];
        let cms = roles.filter(role => role.name !== 'Affiliate Manager');
        let progressBar = new ProgressBar(' Processing [:bar] :percent', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: workshops.length
        })
        for (let workshop of workshops) {
            const permission = { resource: `/workshops/${workshop.Id}`, level: 2 } as IPermission;
            await this.auth.createPermissionAsync(permission);
            await this.addFacPermissions(workshop, permission);
            await this.auth.grantPermissionToRoleAsync(permission.resource, 2, afMan.id);
            let cm = cms.filter(role => role.name.includes(workshop.Organizing_Affiliate__c))[0];
            await this.auth.grantPermissionToRoleAsync(permission.resource, 2, cm.id);
            progressBar.tick(1);
        }
    }

    private async addFacPermissions(workshop: IWorkshop, permission: IPermission) {
        for (let contact of workshop.Instructors__r.records) {
            let user = this.userMap[contact.Instructor__c.Id];
            if (user) await this.auth.grantPermissionToUserAsync(permission.resource, 2, user.Id);
        }
    }

    private async queryFacilitators() {
        let facilitatorQuery: IQueryRequestMessage = {
            action: 'SELECT',
            fields: ['Id', 'Email', 'AccountId'],
            table: 'Contact',
            clauses: `RecordType.Name='Affiliate Instructor'`
        }
        return await this.handleQuery(facilitatorQuery);
    }

    private async queryWorkshops() {
        let workshopQuery: IQueryRequestMessage = {
            action: 'SELECT',
            fields: [
                'Id',
                'Organizing_Affiliate__c',
                '(SELECT Instructor__c.Id, Instructor__c.Email FROM Instructors__r)'
            ],
            table: 'Workshop__c',
            clauses: undefined
        }
        return await this.handleQuery(workshopQuery);
    }

    private async handleQuery(query: IQueryRequestMessage) {
        let jsonObjectMessage: IJSONObjectMessage = await this.sf.queryAsync(query);
        let queryResponse: ISFQueryResponse = JSON.parse(jsonObjectMessage.contents);
        console.log('is done? ', queryResponse.done);
        return queryResponse.records;
    }
}