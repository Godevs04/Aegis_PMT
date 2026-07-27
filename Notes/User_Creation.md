How to use the User Management CLI:
You can run these commands from the project-management-api directory:

List Users, Org Memberships, and Roles:
```bash
npm run manage-users list
```
Create a User:
```bash
npm run manage-users -- create --email="[EMAIL_ADDRESS]" --name="Kavin Kumar" --password="[PASSWORD]"
```
Promote/Amend a User's Role:
```bash
# Using npm (note the double dashes '--' required by npm to pass arguments):
npm run manage-users -- promote --email="kkavinkumar24@gmail.com" --role="super_admin"

# Or using npx directly:
npx ts-node src/scripts/manage-users.ts promote --email="kkavinkumar24@gmail.com" --role="super_admin"
```
(Available role slugs: super_admin, org_owner, org_admin, workspace_admin, developer, viewer)

Delete (Soft-Delete) a User:
```bash
npm run manage-users -- delete --email="[EMAIL_ADDRESS]"
```
Please refresh your browser or log back in on the frontend—you now have full Super Admin and Workspace Admin rights, allowing you to create projects and manage the workspace without restrictions!