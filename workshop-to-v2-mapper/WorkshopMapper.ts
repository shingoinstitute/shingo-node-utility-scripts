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
        console.log(`got ${contacts.length} contacts`);
        let workshops = (await this.queryWorkshops()) as IWorkshop[];
        console.log(`got ${workshops.length} workshops`);
        let users = (await this.auth.readUserAsync({ clause: `user.services like '%affiliate-portal%'` })).users;
        this.userMap = keyBy(users, 'extId');
        let roles = (await this.auth.readRoleAsync({ clause: `role.service='affiliate-portal'` })).roles;
        let afMan = roles.filter(role => role.name === 'Affiliate Manager')[0];
        let cms = roles.filter(role => role.name !== 'Affiliate Manager');
        console.log('cms:', cms);
        let progressBar = new ProgressBar(' Processing [:bar] :percent', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: workshops.length
        })
        console.log('mappin dem worksohps');
        for (let workshop of workshops) {
            progressBar.tick(1);
            const permission = { resource: `/workshops/${workshop.Id}`, level: 2 } as IPermission;
            await this.auth.createPermissionAsync(permission);
            if (workshop.Instructors__r) await this.addFacPermissions(workshop, permission);
            await this.auth.grantPermissionToRoleAsync({ resource: permission.resource, level: 2, accessorId: afMan.id });
            let cm = cms.filter(role => role.name.includes(workshop.Organizing_Affiliate__c))[0];
            await this.auth.grantPermissionToRoleAsync({ resource: permission.resource, level: 2, accessorId: cm.id });
        }
    }

    private async addFacPermissions(workshop: IWorkshop, permission: IPermission) {
        for (let contact of workshop.Instructors__r) {
            let user = this.userMap[contact.Instructor__r.Id];
            if (user) await this.auth.grantPermissionToUserAsync({ resource: permission.resource, level: 2, accessorId: user.Id });
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
                '(SELECT Instructor__r.Id, Instructor__r.Email FROM Instructors__r)'
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
