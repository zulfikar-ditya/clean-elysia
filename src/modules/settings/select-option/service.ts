import { PermissionRepository } from "@postgres/repositories";
import { RoleRepository } from "@postgres/repositories/role.repository";

export const SelectOptionService = {
	permissionSelect: async () => {
		return await PermissionRepository().selectOptions();
	},
	roleSelect: async () => {
		return await RoleRepository().selectOptions();
	},
};
