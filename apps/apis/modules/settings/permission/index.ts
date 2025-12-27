// apps/apis/modules/settings/permission/index.ts
import { AuthPlugin } from "@packages";
import { DatatableToolkit } from "@toolkit/datatable";
import {
	CommonResponseSchemas,
	PaginatedResponseSchema,
	ResponseToolkit,
	SuccessResponseSchema,
} from "@toolkit/response";
import Elysia, { t } from "elysia";

import { DatatableQueryParams } from "../../../types/datatable";
import { PermissionService } from "./service";

const PermissionCreateSchema = t.Object({
	name: t.Array(t.String({ minLength: 1, maxLength: 255 })),
	group: t.String({ minLength: 1, maxLength: 100 }),
});

const PermissionUpdateSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 255 }),
	group: t.String({ minLength: 1, maxLength: 100 }),
});

export const PermissionModule = new Elysia({
	prefix: "/permissions",
	detail: {
		tags: ["Permissions"],
	},
})
	.use(AuthPlugin)
	.guard(
		{
			beforeHandle: ({ user, set }) => {
				if (!user) {
					set.status = 401;
					return false;
				}
				return true;
			},
		},
		(app) =>
			app
				// List permissions - requires superuser role
				.get(
					"/",
					async ({ query }) => {
						const queryParam = DatatableToolkit.parseFilter({ query });
						const result = await PermissionService.findAll(queryParam);

						return ResponseToolkit.success(
							result,
							"Permission list retrieved successfully",
							200,
						);
					},
					{
						query: DatatableQueryParams,
						detail: {
							summary: "List all permissions",
							description:
								"Retrieve a paginated list of permissions with optional filtering",
						},
						response: {
							400: CommonResponseSchemas[400],
							401: CommonResponseSchemas[401],
							500: CommonResponseSchemas[500],
							200: PaginatedResponseSchema(
								t.Object({
									id: t.String({ format: "uuid" }),
									name: t.String(),
									group: t.String(),
									createdAt: t.String({ format: "date-time" }),
									updatedAt: t.String({ format: "date-time" }),
								}),
							),
						},
					},
				)
				// Create permission
				.post(
					"/",
					async ({ body }) => {
						await PermissionService.create(body);

						return ResponseToolkit.success(
							null,
							"Permission created successfully",
							201,
						);
					},
					{
						body: PermissionCreateSchema,
						detail: {
							summary: "Create new permission(s)",
							description: "Create one or more permissions in a specific group",
						},
						response: {
							400: CommonResponseSchemas[400],
							401: CommonResponseSchemas[401],
							500: CommonResponseSchemas[500],
							422: CommonResponseSchemas[422],
							201: CommonResponseSchemas[201],
						},
					},
				)
				// Get permission detail
				.get(
					"/:id",
					async ({ params }) => {
						const result = await PermissionService.detail(params.id);
						return ResponseToolkit.success(
							result,
							"Permission detail retrieved successfully",
							200,
						);
					},
					{
						params: t.Object({
							id: t.String({ format: "uuid" }),
						}),
						detail: {
							summary: "Get permission detail",
							description:
								"Retrieve detailed information about a specific permission",
						},
						response: {
							400: CommonResponseSchemas[400],
							401: CommonResponseSchemas[401],
							404: CommonResponseSchemas[404],
							422: CommonResponseSchemas[422],
							500: CommonResponseSchemas[500],
							200: SuccessResponseSchema(
								t.Object({
									id: t.String({ format: "uuid" }),
									name: t.String(),
									group: t.String(),
									createdAt: t.String({ format: "date-time" }),
									updatedAt: t.String({ format: "date-time" }),
								}),
							),
						},
					},
				)
				// Update permission
				.patch(
					"/:id",
					async ({ params, body }) => {
						await PermissionService.update(params.id, body);
						return ResponseToolkit.success(
							null,
							"Permission updated successfully",
							200,
						);
					},
					{
						params: t.Object({
							id: t.String({ format: "uuid" }),
						}),
						body: PermissionUpdateSchema,
						detail: {
							summary: "Update permission",
							description: "Update an existing permission's details",
						},
						response: {
							400: CommonResponseSchemas[400],
							401: CommonResponseSchemas[401],
							404: CommonResponseSchemas[404],
							422: CommonResponseSchemas[422],
							500: CommonResponseSchemas[500],
							200: SuccessResponseSchema(t.Null()),
						},
					},
				)
				// Delete permission
				.delete(
					"/:id",
					async ({ params }) => {
						await PermissionService.delete(params.id);
						return ResponseToolkit.success(
							null,
							"Permission deleted successfully",
							200,
						);
					},
					{
						params: t.Object({
							id: t.String({ format: "uuid" }),
						}),
						detail: {
							summary: "Delete permission",
							description: "Permanently delete a permission",
						},
						response: {
							400: CommonResponseSchemas[400],
							401: CommonResponseSchemas[401],
							404: CommonResponseSchemas[404],
							422: CommonResponseSchemas[422],
							500: CommonResponseSchemas[500],
							200: SuccessResponseSchema(t.Null()),
						},
					},
				),
	);
