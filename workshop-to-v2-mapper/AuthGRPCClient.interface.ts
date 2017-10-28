import { IUser } from './User.interface';
import { IPermission } from './Permission.interface';
import { IRole } from './Role.interface';

export interface IAuthGRPCClient {
    readUserAsync({ clause: string }): Promise<any>;
    readRoleAsync({ clause: string }): Promise<any>;
    createPermissionAsync(permission: IPermission): Promise<any>;
    grantPermissionToUserAsync({ resource, level, accessorId }): Promise<any>;
    grantPermissionToRoleAsync({ resource, level, accessorId }): Promise<any>;
}
