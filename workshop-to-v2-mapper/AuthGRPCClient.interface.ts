import { IUser } from './User.interface';
import { IPermission } from './Permission.interface';
import { IRole } from './Role.interface';

export interface IAuthGRPCClient {
    getUsersAsync(clause: string): Promise<IUser[]>;
    getRolesAsync(clause: string): Promise<IRole[]>;
    getPermissionsAsync(clause: string): Promise<IPermission[]>;
    createPermissionAsync(permission: IPermission): Promise<any>;
    grantPermissionToUserAsync(resource: string, level: 0 | 1 | 2, userId: number): Promise<any>;
    grantPermissionToRoleAsync(resource: string, level: 0 | 1 | 2, roleId: number): Promise<any>;
}