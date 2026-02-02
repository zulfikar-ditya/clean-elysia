import { PermissionRepository, RoleRepository } from "@libs";

export const SelectOptionService = {
	permissionSelect: async () => {
		return await PermissionRepository().selectOptions();
	},
	roleSelect: async () => {
		return await RoleRepository().selectOptions();
	},
};
