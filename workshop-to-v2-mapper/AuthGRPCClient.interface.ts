import { IUser } from './User.interface';
import { IPermission } from './Permission.interface';
import { IRole } from './Role.interface';

export interface IAuthGRPCClient {
    readUserAsync({clause: string}): Promise<any>;
    readRoleAsync({clause: string}): Promise<any>;
    createPermissionAsync(permission: IPermission): Promise<any>;
    grantPermissionToUserAsync(resource: string, level: 0 | 1 | 2, userId: number): Promise<any>;
    grantPermissionToRoleAsync(resource: string, level: 0 | 1 | 2, roleId: number): Promise<any>;
}
