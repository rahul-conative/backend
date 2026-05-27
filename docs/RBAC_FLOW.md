# RBAC Flow Guide

This guide explains the simplified RBAC model for the ecommerce admin and seller system.

The whole system should be understood as two questions:

1. Can the user see and open this management area?
2. Inside that area, which actions can the user perform?

In code, the first question is `module:view`. The second question is the action permission, such as `module:create`, `module:update`, or `module:delete`.

## Core Rule

Use one permission shape everywhere:

```text
module:action
```

Examples:

```text
products:view
products:create
products:update
orders:view
orders:status_change
rbac:assign
countries:delete
```

`module:view` is the base permission.

- It shows the sidebar item.
- It allows the page route to open.
- It allows GET/list/detail API reads.

If any non-view action is assigned, `view` is automatically added for that module.

Example:

```json
{
  "modulePermissions": [
    { "module": "products", "actions": ["update"] }
  ]
}
```

RBAC stores this as:

```text
products:view
products:update
```

## Final Permission Calculation

Effective permissions are calculated like this:

```text
finalPermissions =
  rolePermissions
  + userDirectPermissions
  + sidebarExpandedPermissions
  - deniedPermissions
```

Important details:

- Super admin bypasses restriction and receives all active permissions.
- Role permissions come from `role_permissions`.
- Direct user permissions come from `user_permissions` with `metadata.effect = "allow"`.
- Denied permissions come from `user_permissions` with `metadata.effect = "deny"`.
- Deny wins over role and direct allow.
- Sidebar permissions expand to real backend module permissions.
- Non-view actions imply `view`.
- Denying a non-view action does not auto-deny `view`; deny `module:view` separately when the page itself should disappear.

## User Types

### Super Admin

- Full platform access.
- Can create admins.
- Can create roles.
- Can assign any module/action.
- Cannot be restricted.

### Admin

- Gets modules/actions assigned by Super Admin.
- Can create sub-admins under himself.
- Can assign only modules/actions he already has.
- Cannot assign permissions he does not have.

### Admin Sub Admin

- Gets modules/actions assigned by Admin or Super Admin.
- Can work only inside assigned modules.
- Cannot assign roles/permissions unless an `assign` permission is granted for the relevant management area. RBAC APIs require `rbac:assign`; admin-user module assignment can require `admin_users:assign`.

### Seller

- Owner of a seller account/store.
- Gets seller-side module permissions by role.
- Can create seller admins and seller sub-admins.
- Can assign only seller-side modules/actions.

### Seller Admin

- Created under a seller.
- Can manage assigned seller modules.
- Can create seller sub-admins only if assignment permission is granted through the seller staff APIs.
- Cannot access platform/admin modules.

### Seller Sub Admin

- Lowest seller staff level.
- Can access only assigned seller modules/actions.

## Action Meaning

Use these actions consistently in backend, frontend, sidebar, and matrix UI:

```text
view          show sidebar, open page, allow GET
create        show Add button, allow POST
update        show Edit button, allow PATCH/PUT
delete        show Delete button, allow DELETE
status_change show status toggle, allow status endpoints
approve       show approve button, allow approval endpoint
reject        show reject button, allow reject endpoint
export        show export button, allow export endpoint
import        show import button, allow import endpoint
assign        allow permission/role/module assignment
```

Legacy aliases still exist for compatibility:

```text
add  <-> create
edit <-> update
status <-> status_change
approval <-> approve
```

## Sidebar Rule

Sidebar visibility is based on `module:view`.

Examples:

```text
products:view = show Product Management
orders:view   = show Order Management
rbac:view     = show Roles & Permissions
countries:view = show Country Management
```

The sidebar catalog is:

```text
src/shared/auth/admin-sidebar-catalog.js
```

Each sidebar item has `requiredModule`.

Example:

```js
{
  moduleName: "All Products",
  routePath: "/app/product-catalog",
  requiredModule: "products"
}
```

The sidebar API is:

```http
GET /api/rbac/modules/sidebar
```

If a user receives a sidebar permission, RBAC expands it to the backend module permission.

Example:

```text
sidebar-product-catalog:view
```

The sidebar item has:

```text
requiredModule = products
```

RBAC expands it to:

```text
products:view
```

Expansion happens in:

```text
RbacService.expandSidebarPermissionIds()
```

## Page Rule

Frontend page routes should require `module:view`.

If the user opens a URL directly without `module:view`:

- block the route;
- show the unauthorized page/message;
- do not load API data.

Frontend helpers should use this shape:

```js
hasPermission("products", "view")
canView("products")
```

## Button Rule

Buttons and row actions should map directly to action permissions:

```text
create        Add button
update        Edit button
delete        Delete button
status_change Active/inactive/status controls
approve       Approve button
reject        Reject button
export        Export button
import        Import button
assign        Assign role/module/permission controls
```

Frontend helpers should use this shape:

```js
canCreate("products")
canUpdate("orders")
canDelete("countries")
hasPermission("rbac", "assign")
```

Frontend hiding is only UX. The backend still validates API access.

## API Rule

Every protected request must pass backend authorization:

1. `authenticate` validates the token.
2. Current RBAC permissions are hydrated into `req.auth`.
3. `access.js` detects the request module and action.
4. The request is blocked unless the user has the needed permission.

Key files:

```text
src/shared/middleware/authenticate.js
src/shared/middleware/access.js
src/shared/auth/module-access.js
```

HTTP methods map to actions:

```text
GET    -> view
POST   -> create
PUT    -> update
PATCH  -> update
DELETE -> delete
```

Path overrides:

```text
/approve      -> approve
/approval     -> approve
/reject       -> reject
/status       -> status_change
/permissions  -> assign, unless GET
/roles        -> assign, unless GET
/bulk         -> bulk_action, unless GET
/import       -> import
/export       -> export
```

## Main Data Stores

Mongo user document stores identity and scope:

```text
role
allowedModules
ownerAdminId
ownerSellerId
permissionVersion
sessionVersion
```

SQL stores RBAC catalog and assignments:

```text
modules
permissions
roles
role_permissions
user_permissions
user_roles
super_admins
```

`user_permissions.metadata.effect` decides direct allow/deny:

```json
{ "effect": "allow" }
```

```json
{ "effect": "deny" }
```

## Required Management Modules

Use these module slugs for permission assignment and route checks:

```text
admin              Dashboard
users              User Management
admin_users        Admin/Sub Admin Management
rbac               Roles & Permissions
sellers            Seller/Vendor Management
seller_kyc         Seller KYC Management
seller_bank        Seller Bank Management
products           Product Management
categories         Category Management
sub_categories     Sub Category Management
sub_sub_categories Sub Sub Category Management
brands             Brand Management
option_masters     Option Master Management
option_values      Option Value Management
inventory          Inventory Management
orders             Order Management
coupons            Coupon Management
banners            Banner Management
cms_pages          CMS/Page Management
reviews            Review & Rating Management
notifications      Notification Management
reports            Report Management
countries          Country Management
states             State Management
cities             City Management
zip_codes          Zip Code Management
```

These modules are seeded from:

```text
src/shared/auth/module-catalog.js
scripts/db/seed-rbac.js
```

Sidebar entries are seeded from:

```text
src/shared/auth/admin-sidebar-catalog.js
```

Route-to-module mapping is centralized in:

```text
src/shared/auth/module-access.js
```

## Location Modules

Location management is split into separate modules:

```text
countries:view/create/update/delete/status_change
states:view/create/update/delete/status_change
cities:view/create/update/delete/status_change
zip_codes:view/create/update/delete/status_change
```

Data dependency:

```text
State belongs to Country
City belongs to Country + State
Zip Code belongs to Country + State + City
```

API route mapping:

```text
/api/admin/common/countries  -> countries
/api/admin/common/states     -> states
/api/admin/common/cities     -> cities
/api/admin/common/zip-codes  -> zip_codes
```

## Role Permissions

Use role permissions when every user with that role should receive the same access.

Routes:

```http
GET  /api/rbac/roles/:roleId/permissions
POST /api/rbac/roles/:roleId/permissions
POST /api/rbac/roles/:roleId/permissions/bulk
PUT  /api/rbac/roles/:roleId/permissions
```

The `PUT` route replaces all role permissions:

```json
{
  "permissionIds": ["permission-uuid-1", "permission-uuid-2"]
}
```

Changing role permissions invalidates assigned users' auth sessions so fresh permissions are loaded.

## User Direct Permissions And Denies

Use user permissions when one user needs custom access.

Routes:

```http
GET    /api/rbac/users/:userId/permissions
GET    /api/rbac/users/:userId/permissions/effective
POST   /api/rbac/users/:userId/permissions
POST   /api/rbac/users/:userId/permissions/bulk
PUT    /api/rbac/users/:userId/permissions
DELETE /api/rbac/users/:userId/permissions
```

Use `PUT` to sync direct allow and deny permissions in one call:

```json
{
  "permissionIds": ["allow-permission-uuid"],
  "deniedPermissionIds": ["deny-permission-uuid"]
}
```

This updates `user_permissions` using:

```text
metadata.effect = allow
metadata.effect = deny
```

Denied permissions are removed from the final effective permission set even if they come from a role.

## Admin/Sub-Admin Assignment Flow

Use admin access APIs for admin-side users because they update both Mongo scope and SQL permissions.

Create sub-admin:

```http
POST /api/admin/access/sub-admins
```

Update modules and actions:

```http
PATCH /api/admin/access/sub-admins/:userId/modules
```

Payload:

```json
{
  "allowedModules": ["products", "orders", "rbac"],
  "modulePermissions": [
    { "module": "products", "actions": ["view", "create", "update"] },
    { "module": "orders", "actions": ["view", "status_change"] },
    { "module": "rbac", "actions": ["view", "assign"] }
  ]
}
```

Code path:

```text
src/modules/admin/services/admin.service.js
```

Rules:

- Super Admin can assign anything.
- Admin can assign only modules/actions he already has.
- Sub-admin cannot assign unless the relevant `assign` permission is granted.

## Seller Staff Assignment Flow

Use seller staff APIs for seller admins and seller sub-admins.

Payload:

```json
{
  "allowedModules": ["products", "orders", "inventory"],
  "modulePermissions": [
    { "module": "products", "actions": ["view", "create", "update"] },
    { "module": "orders", "actions": ["view"] },
    { "module": "inventory", "actions": ["view", "update"] }
  ]
}
```

Code path:

```text
src/modules/seller/services/seller.service.js
```

Rules:

- Seller can assign only seller-side modules/actions.
- Seller Admin can assign only if the seller staff flow allows it and the actor has the permission.
- Seller Sub Admin cannot assign unless explicitly allowed.
- Seller staff cannot access platform/admin-only modules.

## Permission Matrix UI

Use one matrix UI for role and user permission assignment.

Endpoint:

```http
GET /api/rbac/permission-management/modules
```

For a role:

```http
GET /api/rbac/permission-management/modules?roleSlug=sub-admin
```

For a user:

```http
GET /api/rbac/permission-management/modules?userId=<userId>
```

For sidebar-specific assignment:

```http
GET /api/rbac/permission-management/modules?scope=sidebar
GET /api/rbac/permission-management/modules?userId=<userId>&scope=sidebar
GET /api/rbac/permission-management/modules?roleSlug=sub-admin&scope=sidebar
```

Matrix columns:

```text
Module name
View
Create
Update
Delete
Status Change
Approve
Reject
Export
Import
```

UI rules:

- Auto-check `View` when any other action is checked.
- Disable actions the current actor cannot delegate.
- For user-specific view, show role permissions, extra user permissions, denied permissions, and final effective permissions.
- Add an "Effective Permissions" modal using the effective permissions endpoint.

The matrix response includes:

```text
modules
permissions
permissionsByAction
permissionKeys
assignedPermissionCount
assignedPermissionIds
deniedPermissionIds
totals
actions
```

## Effective Permissions Debug API

Use this whenever access is confusing:

```http
GET /api/rbac/users/:userId/permissions/effective
```

The response includes:

```text
assignedModules
assignedPermissions
rolePermissions
extraUserPermissions
deniedPermissions
permissionBreakdown
permissionsByAction
sidebarModules
effectivePermissions
```

This answers questions like:

```text
Why can this user see Products?
Why can this user not update Orders?
Why is this sidebar item missing?
Which role gave this permission?
Which user-level deny removed it?
```

## Frontend Utility Contract

The frontend should keep all permission checks in reusable utilities:

```js
hasPermission(module, action)
canView(module)
canCreate(module)
canUpdate(module)
canDelete(module)
PermissionGuard
ProtectedRoute
SidebarPermissionFilter
ActionButtonGuard
```

Expected behavior:

```js
canView("products")       // products:view
canCreate("products")     // products:create
canUpdate("products")     // products:update
canDelete("products")     // products:delete
hasPermission("rbac", "assign")
```

Frontend route protection must use `module:view`.

Frontend action buttons must use the matching action permission.

Never hardcode sidebar visibility by role. Use the sidebar API and permission helpers.

## Delegation Rules

Non-super-admin actors cannot assign freely.

Backend checks:

- Target user must be inside the actor's hierarchy.
- Admin can assign to sub-admins, sellers, seller-admins, and seller-sub-admins under that admin.
- Seller or seller-admin can assign to seller-admin/seller-sub-admin under that seller.
- Actor cannot assign permission IDs he does not already have.
- Scoped admin/seller actors cannot assign unavailable modules/actions.

Code paths:

```text
RbacService.assertCanAssignUserPermissions()
AdminService.constrainModuleAssignmentByActor()
SellerService.constrainModuleAssignmentByActor()
```

## Common Debug Checklist

If access is not working:

1. Check the Mongo user `role`.
2. Check Mongo `allowedModules`.
3. Call `GET /api/rbac/users/:userId/permissions/effective`.
4. Confirm the needed slug exists, for example `products:update`.
5. Confirm no deny removes it.
6. Confirm the API route maps to the expected module in `module-access.js`.
7. Confirm the inferred action is correct.
8. If sidebar is missing, confirm `module:view` exists.
9. If permissions were just changed, force a fresh token/session.

## File Map

RBAC routes:

```text
src/modules/rbac/routes/rbac.routes.js
```

RBAC business logic:

```text
src/modules/rbac/services/rbac.service.js
```

RBAC database queries:

```text
src/modules/rbac/repositories/rbac.repository.js
```

Shared permission helpers:

```text
src/shared/auth/rbac-permissions.js
```

Route auth and permission checks:

```text
src/shared/middleware/authenticate.js
src/shared/middleware/access.js
```

API route to module mapping:

```text
src/shared/auth/module-access.js
```

Backend module catalog:

```text
src/shared/auth/module-catalog.js
```

Sidebar catalog:

```text
src/shared/auth/admin-sidebar-catalog.js
```

Admin/sub-admin assignment flow:

```text
src/modules/admin/services/admin.service.js
```

Seller staff assignment flow:

```text
src/modules/seller/services/seller.service.js
```

RBAC seeding:

```text
scripts/db/seed-rbac.js
```
