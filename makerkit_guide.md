MAKERKIT_CUSTOMIZATION
Updating the Tailwind CSS Shadcn theme | Next.js Supabase SaaS Kit
How to update the Tailwind CSS theme in your Makerkit application
Makerkit uses Tailwind CSS to style the application.

Tailwind CSS (v4) Configuration
If you are using Tailwind CSS v4, you can update the configuration in the apps/web/styles/global.css file.

This file imports the following Tailwind CSS configuration files:

apps/web/styles/global.css: - the main global styles for the application (imports the other files)
apps/web/styles/theme.css - this is where we store the Shadcn UI theme for Tailwind CSS v4
apps/web/styles/shadcn-ui.css - where you can override the default style, either define your own colors or pick a theme from the Shadcn UI Themes page.
apps/web/styles/markdoc.css - for markdoc content
apps/web/styles/makerkit.css - for makerkit-specific styles
apps/web/styles/theme.utilities.css - for utility classes
Tailwind CSS (v3) Configuration
The older default configuration is at tooling/tailwind/index.ts - where you can set the default colors, fonts, and more.

Whenever you add a new package, please remember to update the Tailwind configuration file and add the path to the content glob


  content: [
    '../../packages/ui/src/**/*.tsx',
    '../../packages/billing/gateway/src/**/*.tsx',
    '../../packages/features/auth/src/**/*.tsx',
    '../../packages/features/notifications/src/**/*.tsx',
    '../../packages/features/admin/src/**/*.tsx',
    '../../packages/features/accounts/src/**/*.tsx',
    '../../packages/features/team-accounts/src/**/*.tsx',
    '../../packages/plugins/testimonial/src/**/*.tsx',
    '../../packages/plugins/roadmap/src/**/*.tsx',
    '../../packages/plugins/kanban/src/**/*.tsx',
    // add the path to the content glob
    '!**/node_modules',
  ],
Shadcn UI Theme
Makerkit uses Shadcn UI and it defines the theme according to its guidelines.

You can find the default theme inside the application at apps/web/styles/global.css.

If you want to override the default style, either define your own colors or pick a theme from the Shadcn UI Themes page, and copy/paste the theme into this file.

Using JSX files
If you plan on using JSX files, please update the global paths in the content glob in the Tailwind configuration file.

For targeting both TSX and JSX files, update the content glob paths {tsx|jsx}. For example:


  content: [
    '../../packages/ui/src/**/*.{tsx,jsx}',
    '../../packages/billing/gateway/src/**/*.{tsx,jsx}',
    '../../packages/features/auth/src/**/*.{tsx,jsx}',
    '../../packages/features/notifications/src/**/*.{tsx,jsx}',
    '../../packages/features/admin/src/**/*.{tsx,jsx}',
    '../../packages/features/accounts/src/**/*.{tsx,jsx}',
    '../../packages/features/team-accounts/src/**/*.{tsx,jsx}',
    '../../packages/plugins/testimonial/src/**/*.{tsx,jsx}',
    '../../packages/plugins/roadmap/src/**/*.{tsx,jsx}',
    '../../packages/plugins/kanban/src/**/*.{tsx,jsx}',
    '!**/node_modules',
  ],
You will need to do the same in apps/web/tailwind.config.ts.
##
Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit
How to update the theme in your Makerkit application
Makerkit uses Shadcn UI and it defines the theme according to its guidelines.

You can find the default theme inside the application at apps/web/styles/shadcn-ui.css.

If you want to override the default style, either define your own colors or pick a theme from the Shadcn Themes page, and copy/paste the theme into this file.

One difference with the Shadcn UI theme (Tailwind CSS v3 as of this writing), is that you need to convert the CSS variables to using the hsl function.

For example, the default theme has the following CSS variable:


--color-primary: 229 231 239;
To convert it to the hsl function, you need to convert the values to HSL and then convert them to hex.


--color-primary: hsl(229 23% 15%);
You can use any AI tool for quickly converting the Shadcn UI CSS theme to the hsl function.

##

How to add new Shadcn UI components to your Next.js Supabase application
Update your Next.js Supabase application with new Shadcn UI components
Makerkit implements most of the Shadcn UI components - however, if you need to add a new component, you can do so by following the steps below.

Use Manual Installation steps from the Shadcn UI component documentation.
Add the component to the packages/ui/src/shadcn directory.
Replace the imports with the relative imports.
Export the component by adding a new export to the package.json file.
Import the component directly from the package.
Exporting the component
To achieve optimal tree-shaking, we export each component individually using the exports field in the package.json file. This allows you to import the component directly from the package.

Once the component has been created, you can export by adding a new export to the package.json file.

We assume that the component is located at src/shadcn/avatar.tsx. To export the component, you can append a new export field to the exports map inside the package.json file:


{
  "exports": {
    "./avatar": "./src/shadcn/avatar.tsx"
  }
}
Now you can import it directly from the package:


import { Avatar } from '@kit/ui/avatar';
NB: this is an example, you need to adjust the component name based on the component you are exporting.

##

Update the default fonts of your SaaS
Learn how to update the fonts of your Makerkit application
By default, Makerkit uses two fonts:

font-sans: using Apple's default font on Apple devices, or Inter on others
font-heading: uses Urbanist from Google Fonts
The fonts are defined at apps/web/lib/fonts.ts:


import { Urbanist as HeadingFont, Inter as SansFont } from 'next/font/google';
/**
 * @sans
 * @description Define here the sans font.
 * By default, it uses the Inter font from Google Fonts.
 */
const sans = SansFont({
  subsets: ['latin'],
  variable: '--font-sans',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial'],
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
});
/**
 * @heading
 * @description Define here the heading font.
 * By default, it uses the Urbanist font from Google Fonts.
 */
const heading = HeadingFont({
  subsets: ['latin'],
  variable: '--font-heading',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial'],
  preload: true,
  weight: ['500', '700'],
});
// we export these fonts into the root layout
export { sans, heading };
To display a different font, please replace the imports from next/font/google if the font is there.

Removing Apple's system as default font on Apple Devices
To set another font instead of Apple's system font, update the Tailwind variables.

Open apps/web/styles/shadcn-ui.css.css and replace -apple-system with the font you want to use.

##

Update the default layout style of your SaaS | Next.js Supabase SaaS Starter Kit
Learn how to update the default layout style of your Makerkit application
How to update the default layout style of your Makerkit application
Learn how to update the default layout style of your Makerkit application

1
Changing the layout style

2
Sidebar Layout

3
Header Layout

By default, Makerkit uses the sidebar layout style for both the user and the team workspaces.

Changing the layout style
You can change the layout style by setting the NEXT_PUBLIC_USER_NAVIGATION_STYLE and NEXT_PUBLIC_TEAM_NAVIGATION_STYLE environment variables. The default style is sidebar.

To set the layout style to header, update the environment variables:


NEXT_PUBLIC_TEAM_NAVIGATION_STYLE=header
NEXT_PUBLIC_USER_NAVIGATION_STYLE=header
Sidebar Layout
The default layout style is sidebar:


You can customize the sidebar layout to set it as expanded or collapsed. By default, it is always set to expanded.


NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED=true
NEXT_PUBLIC_TEAM_SIDEBAR_COLLAPSED=true
You can decide the configuration for the each workspace.

######

MAKERKIT_DEVELOPMENT
How to approach local development | Next.js Supabase Turbo
Learn how to approach local development in your Next.js Supabase Turbo project
In the previous sections, you learned how to clone the repository, set environment variables, customize the look and feel of the app, and some basic API that you'll be using throughout the app.

In this section, you'll learn how to start developing your app locally.

Buckle up, we have a lot to do!

Generally speaking, you will be doing the following:

Customization: Set environment variables (application name, feature flags). This is a quick starting point that will start turning Makerkit into your very own app.
Database: Drawing and writing the database schema. Of course, your app will store data and have its schema. It's time to draw it.
Routing: Adding new routes. Your new pages will need routes - unless you can reuse the "home" pages of the accounts.
Fetching Data: Fetching data from your DB and displaying it onto the new routes.
Writing Data Adding new forms. You will need to add forms to create new data.
In 90% of cases, the above is what you will be doing. The remaining 10% is adding new (very specific) features, which are a bit more complex - and not relevant to Makerkit itself.
##
How to create new migrations and update the database schema in your Next.js Supabase application
Learn how to create new migrations and update the database schema in your Next.js Supabase application
How to create new migrations and update the database schema
Learn how to create new migrations and update the database schema in your Next.js Supabase application

1
Do not use Supabase Studio to make schema changes

2
Updating the Database Schema

3
Creating a migration file from a schema change

4
Pushing the migration to the remote Supabase instance

5
Applying changes to the database schema

Creating a schema for your data is one of the primary tasks when building a new application. In this guide, we'll walk through how to create new migrations and update the database schema in your Next.js Supabase application.

Do not use Supabase Studio to make schema changes (recommendation)
Supabase's hosted Studio is pretty great - but I don't think it should be used to perform schema changes. Instead, I recommend using your local Supabase Studio to make the changes and then generate the migration file. Then, you can push the migration to the remote Supabase instance.

Declarative schema
Using Supabase's declarative schema, you can define your schema at apps/web/supabase/schemas. In here, we can create a new file called using whatever name you want: for example, if our schema is about integrations, we can create a file called integrations.sql.

The file should contain the SQL statements to create the schema.

For example, here's a basic schema for an integrations table:


create table if not exists public.integrations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
Creating a migration file from a schema change
Now, you want this schema to be applied to your local Supabase instance so you can start using it and test it out.

We can now use Supabase's diffing feature to generate a migration file for us.


pnpm --filter web run supabase:stop     # Stop the Supabase service
pnpm --filter web run supabase:db:diff -f <filename>  # Generate the migration file using the diffing feature
These two commands will respectively:

Stop the Supabase service
Generate the migration file using the diffing feature
The migration file will be created in the apps/web/supabase/migrations directory. Now, we want to restart Supabase with the no-backup flag to avoid restoring the database from the backup.


pnpm run supabase:web:start --no-backup
Double check the migration file
Make sure the migration file is correct before pushing it to the remote Supabase instance. The diffing tool can make mistakes and has various caveats. Always double check the generated migration file before pushing it to the remote Supabase instance.

Learn more about the known caveats of the diffing tool.

Pushing the migration to the remote Supabase instance
After you're happy with the changes, you can push the migration to the remote Supabase instance. This is so that the changes are reflected in the remote database and not only in your local Supabase Studio.


pnpm --filter web supabase db push
Applying changes to the database schema
Whenever you want to apply changes to the database schema, you can use the same process as above.

Stop the Supabase service
Modify the schema in the apps/web/supabase/schemas directory
Generate the migration file using the diffing feature
Restart Supabase with the no-backup flag to test the changes locally
Push the migration to the remote Supabase instance
##
How to create new migrations and update the database schema in your Next.js Supabase application
Learn how to create new migrations and update the database schema in your Next.js Supabase application
Steps to create a new migration
Learn how to create new migrations and update the database schema in your Next.js Supabase application

1
Permissions

2
RLS Policies

3
Enabling MFA compliance

4
Enabling access to Super Admins only

5
Resetting Migrations

After creating your migration, it's time to add the required code.

In our example, we create the schema for a simple tasks application.

Permissions
Makerkit defines a set of default permissions in an enum named public.app_permissions.

To add more permissions for your app, please update the enum:


-- insert new permissions
alter type public.app_permissions add value 'tasks.write';
alter type public.app_permissions add value 'tasks.delete';
commit;
In the case above, we added the permissions tasks.write and tasks.delete. We can use these in our RLS rules to make sure the permissions are able to restrict access.

Tasks Table
Let's now add the new tasks table


-- create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title varchar(500) not null,
  description varchar(50000),
  done boolean not null default false,
  account_id uuid not null references public.accounts(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
grant select, insert, update, delete on table public.tasks to
    authenticated, service_role;
Let's explain:

uuid is a primary key generated automatically
title is a text field constrained to 500 chars. not null makes sure it cannot be null.
description is a text field constrained to 50000
done is a boolean field
account_id is the account that owns the task
We then add the required permissions to the roles authenticated and service_role.

Anonymous users have no access to this table.

Accounts
Accounts are the primary entities of our schema. An account can be a user or a team.

We can connect an entity to the account that owns it using a foreign key


account_id uuid not null references public.accounts(id)
Enabling RLS
When you create a new table, always enable RLS.


-- enable row level security
alter table tasks enable row level security;
RLS Policies
RLS Policies are fundamental to protect our tables.

We insert an RLS policy for each action: select, insert, update and delete.

Enable RLS for a table
In the majority of cases, you want to enable RLS for a table after creating it:


alter table public.tasks enable row level security;
Selecting Tasks
When writing an RLS policy for selecting data from the tasks table, we need to make sure the user is the owner of the task or has the required permission.

Generally speaking, entities belong to public.accounts - and we can use the account_id to check if the user is the owner.


create policy select_tasks on public.tasks
    for select
    to authenticated
    using (
      account_id = (select auth.uid()) or
      public.has_role_on_account(account_id)
    );
Did you know that an account can be a user or a team? We can use the public.has_role_on_account function to check if the user has a role on the account.

Therefore, this RLS policy works in both ways:

if the user is the owner of the task - we check that the account_id is equal to the auth.uid()
if the user has a role on the account - we check that the user has a role on the account
Inserting Tasks
When writing an RLS policy for inserting data into the tasks table, we need to make sure the user is the owner of the task or has the required permission.


create policy insert_tasks on public.tasks
    for insert
    with check (
        account_id = (select auth.uid()) or
        public.has_permission(auth.uid(), account_id, 'tasks.write'::app_permissions)
    );
In th above, we check if the user is the owner of the task or has the tasks.write permission.

If the account_id is equal to the auth.uid() - the account is personal - so permissions are not required
If the user has the tasks.write permission - the user can insert the task
Updating Tasks
When writing an RLS policy for updating data in the tasks table, we need to make sure the user is the owner of the task or has the required permission.


create policy update_tasks on public.tasks
    for update
    using (
        account_id = (select auth.uid()) or
        public.has_permission(auth.uid(), account_id, 'tasks.write'::app_permissions)
    )
    with check (
        account_id = (select auth.uid()) or
        public.has_permission(auth.uid(), account_id, 'tasks.write'::app_permissions)
    );
Did you know that we need to add the using and with check clauses?

using is used to filter the rows that the user can update
with check is used to check if the user can update the row
In the above, we check if the user is the owner of the task or has the tasks.write permission.

Deleting Tasks
When writing an RLS policy for deleting data from the tasks table, we need to make sure the user is the owner of the task or has the required permission.


create policy delete_tasks on public.tasks
    for delete
    using (
        account_id = (select auth.uid()) or
        public.has_permission(auth.uid(), account_id, 'tasks.delete'::app_permissions)
    );
In the above, we check if the user is the owner of the task or has the tasks.delete permission.

Our schema is now complete! Yay! 🎉

Enable MFA compliance
We can use the function public.is_mfa_compliant to enforce MFA compliance for our application.


create policy restrict_mfa_tasks
    on public.tasks
    as restrictive
    to authenticated
    using (public.is_mfa_compliant());
In the above, we restrict access to the tasks table to users who are MFA compliant. Uses who enabled MFA must be signed in with MFA in order to access the table.

Instead, users who did not enable MFA can keep accessing the table without MFA.

Enable access to Super Admins only
We can use the function public.is_super_admin to restrict access to Super Admins only.

We assume that we're protecting a table named logs and allow select access to Super Admins only.


create policy restrict_logs_super_admins
    on public.logs
    as restrictive
    for select
    to authenticated
    using (public.is_super_admin());
By using the public.is_super_admin function, we ensure that only Super Admins can access the logs table.
By using the restrictive policy, we ensure that this access restriction is enforced, irrespective of other policies.
Resetting Migrations
When adding a new schema, we need to reset the migrations.


pnpm run supabase:web:reset
Then, we generate the new types using the following command:


pnpm run supabase:web:typegen
You can now use the new types in your application when using the Supabase client.
##
Database Functions available in your Next.js Supabase schema
Learn the most useful database functions in your schema
The database schema contains several functions that you can use so that you can extend your database with custom logic and RLS.

How to use Database Functions
Learn how to use the functions in your schema

1
How to use Database Functions

2
Check if a user is the Owner of an Account

3
Check if a user is a Member of an Account

4
Check if a user is a team member of an Account

5
Check if an account has permissions to action another account

6
Check Permissions

7
Check if a configuration is set

8
Check if an account has an active subscription

9
Check if an account is a Super Admin

10
Check if an account is a MFA Compliant

11
Check if an account signed in with MFA

How to use Database Functions
To call the functions below, you can either:

SQL - Use them directly in your SQL schema
RPC - Use them using the Supabase's client RPC API
Example of calling a function from SQL

select public.is_account_owner(account_id) from accounts;
Example of calling a function from RPC

const { data, error } = await supabase.rpc('is_account_owner', { account_id: '123' });
Check if a user is the Owner of an Account
This function checks if the user is the owner of an account. It is used in the accounts table to restrict access to the account owner.


public.is_account_owner(account_id uuid)
This is true if the account is the user's account or if the user created a team account.

Check if a user is a Member of an Account
This function checks if the user is a member of an account. It is used in the accounts table to restrict access to the account members.


public.has_role_on_account(
  account_id uuid,
  account_role varchar(50) default null
)
If the account_role is not provided, it will return true if the user is a member of the account. If the account_role is provided, it will return true if the user has the specified role on the account.

Check if a user is a team member of an Account
Check if a user is a member of a team account. It is used in the accounts table to restrict access to the team members.


public.is_team_member(
  account_id uuid,
  user_id uuid
)
Check if an account has permissions to action another account
This function checks if an account has permissions to action another account. It is used in the accounts table to restrict access to the account owner.


public.can_action_account_member(
  target_team_account_id uuid,
  target_user_id uuid
)
This function will:

check if the current user is the owner of the target account: if so, return true
check if the target user is the owner of the target account: if so, return false
compare the hierarchy of the roles between the two accounts: if the current user has a higher role than the target user, return true
This is useful to check if a user can remove another user from an account, or any other action that requires permissions.

Check Permissions
Check if a user has a specific permission on an account.


public.has_permission(
  user_id uuid,
  account_id uuid,
  permission_name app_permissions
)
This function will return true if the user has the specified permission on the account.

The permissions are specified in the enum app_permissions. You can extend this enum to add more permissions.

Check if a configuration is set
Check if a configuration is set in the public.config table.


public.is_set(
  field_name text
)
Check if an account has an active subscription
Check if an account has an active subscription.


public.has_active_subscription(
  account_id uuid
)
This means that the subscription status is either active or trialing. In other words, the account billing is in good standing (eg. no unpaid invoice)

This is important because just checking if the subscription exists is not enough. You need to check if the subscription is active, as the status can vary (eg. canceled, incomplete, incomplete_expired, past_due, unpaid)

Check if an account is a Super Admin
Check if an account is a Super Admin.


public.is_super_admin()
The functions requires:

The user is authenticated
The user has the super_admin role
The user is currently signed in with MFA
Check if an account is a MFA Compliant
Check if an account is a MFA Compliant - eg:

The user enabled MFA and is currently signed in with MFA
The user did not enable MFA and is currently signed in with AAL1

public.is_mfa_compliant()
This is useful for ensuring that:

Users with MFA comply with the MFA policy
Users without MFA can continue to access the application without MFA
Use the below public.is_aal2 function to force a user to use MFA instead.

Check if an account signed in with MFA
Check if an account signed in with MFA (AAL2) or not. This is useful when you want to restrict access to certain tables based on whether the user is signed in with MFA or not.


public.is_aal2()
##
How to handle custom database webhooks in your Next.js Supabase application
Learn how to handle custom database webhooks in your Next.js Supabase application
How to handle custom database webhooks
Learn how to handle custom database webhooks in your Next.js Supabase application

1
What are Database Webhooks?

2
How to handle custom database webhooks

What are Database Webhooks?
Database webhooks allow you to listen to changes in your database and trigger custom logic when a change occurs. This is useful for sending notifications, updating caches, or triggering other services.

Makerkit handles some webhooks by default for functionalities such as deleting a subscription following a user deletion, or sending emails after a user signs up.

How to handle custom database webhooks
You can extend this functionality by adding your own webhook handlers:

apps/web/app/api/db/webhook/route.ts

import {
 getDatabaseWebhookHandlerService,
} from '@kit/database-webhooks';
/**
* @name POST
* @description POST handler for the webhook route that handles the webhook event
*/
export async function POST(request: Request) {
 const service = getDatabaseWebhookHandlerService();
 try {
   // handle the webhook event
   await service.handleWebhook(request, {
     handleEvent(change) {
       if (change.type === 'INSERT' && change.table === 'invitations') {
         // do something with the invitation
       }
     },
   });
   return new Response(null, { status: 200 });
 } catch {
   return new Response(null, { status: 500 });
 }
}
As you can see above - the handleEvent function is where you can add your custom logic to handle the webhook event. In this example, we check if the event is an INSERT event on the invitations table and then do something with the invitation.

The change object is of type RecordChange and contains the following properties:


import { Database } from '@kit/supabase/database';
export type Tables = Database['public']['Tables'];
export type TableChangeType = 'INSERT' | 'UPDATE' | 'DELETE';
export interface RecordChange<
  Table extends keyof Tables,
  Row = Tables[Table]['Row'],
> {
  type: TableChangeType;
  table: Table;
  record: Row;
  schema: 'public';
  old_record: null | Row;
}
You may need to cast the type manually:


type AccountChange = RecordChange<'accounts'>;
Now, the AccountChange type can be used to type the change object in the handleEvent function and is typed to the accounts table.
##
RBAC: Understanding roles and permissions in Next.js Supabase
Learn how to implement roles and permissions in Next.js Supabase
How to implement roles and permissions
Learn how to implement roles and permissions in Next.js Supabase

1
Roles and Permissions tables

2
Hierarchy levels

3
Adding new permissions

4
Default roles and permissions

5
Adding new roles and permissions

6
Using roles and permissions in RLS

7
Using roles and permissions in application code

8
Using permissions client-side

Makerkit implements granular RBAC for team members. This allows you to define roles and permissions for each team member - giving you fine-grained control over who can access what.

Roles and Permissions tables
Makerkit implements two tables for roles and permissions:

roles table: This table stores the roles for each team member.
role_permissions table: This table stores the permissions for each role.
The "role_permissions" table
The table role_permissions has the following schema:

id: The unique identifier for the role permission.
role: The role for the team member.
permission: The permission for the role.
The "roles" table
The roles table has the following schema:

name: The name of the role. This must be unique.
hierarchy_level: The hierarchy level of the role.
Hierarchy levels
We can use hierarchy_level to define the hierarchy of roles. For example, an admin role can have a higher hierarchy level than a member role. This will help you understand if a role has more permissions than another role.

Adding new permissions
To add new permissions, we can use an enum for permissions app_permissions:

app_permissions enum: This enum stores the permissions for each role.
By default, Makerkit comes with two roles: owner and member - and the following permissions:


create type public.app_permissions as enum(
  'roles.manage',
  'billing.manage',
  'settings.manage',
  'members.manage',
  'invites.manage'
);
You can add more roles and permissions as needed.

Default roles and permissions
The default roles are defined as follows:

Members with owner role have full access to the application.
Members with member role have the following permissions: members.manage and invites.manage.
Adding new roles and permissions
To add new permissions, you can update the app_permissions enum:


-- insert new permissions
alter type public.app_permissions add value 'tasks.write';
alter type public.app_permissions add value 'tasks.delete';
commit;
In the above, we added two new permissions: tasks.write and tasks.delete.

You can assign these permissions to roles in the role_permissions table for fine-grained access control:


insert into public.role_permissions (role, permission) values ('owner', 'tasks.write');
insert into public.role_permissions (role, permission) values ('owner', 'tasks.delete');
Of course - you will need to enforce these permissions in your application code and RLS.

Using roles and permissions in RLS
To check if a user has a certain permission on an account, we can use the function has_permission - which you can use in your RLS to enforce permissions.

In the below, we create an RLS policy insert_tasks on the tasks table to check if a user can insert a new task. We use public.has_permission to check if the current user has the permission tasks.write:


create policy insert_tasks on public.tasks
    for insert
    to authenticated
    with check (
        public.has_permission(auth.uid(), account_id, 'tasks.write'::app_permissions)
    );
And now we can also add a policy to check if a user can delete a task:


create policy delete_tasks on public.tasks
    for delete
    to authenticated
    using (
        public.has_permission(auth.uid(), account_id, 'tasks.delete'::app_permissions)
    );
Using roles and permissions in application code
You can use the exact same function has_permission in your application code to check if a user has a certain permission. You will call the function with the Supabase RPC method:


async function hasPermissionToInsertTask(userId: string, accountId: string) {
  const { data: hasPermission, error } = await client.rpc('has_permission', {
    user_id: userId,
    account_id: accountId,
    permission: 'tasks.write',
  });
  if (error || !hasPermission) {
    throw new Error(`User has no permission to insert task`);
  }
}
You can now use hasPermissionToInsertTask to check if a user has permission to insert a task anywhere in your application code - provided you obtain the user and account IDs.

You can use this function to gate access to certain pages, or verify the user permissions before performing some server-side requests.

Of course, it's always worth making sure RLS is enforced on the database level as well.

Using permissions client-side
While checks must be done always server-side, it is useful to have the permissions available client-side for UI purposes. For example, you may want to hide a certain button if the user does not have the permission to perform an action.

We fetch the permissions as part of the Account Workspace API - which is available to the layout around the account routes.

This API fetches the permissions for the current user and account and makes them available to the client-side simply by passing it from a page to the client components that require it.

Let's assume you have a page, and you want to check if the user has the permission to write tasks:


import { loadTeamWorkspace } from '~/home/[account]/_lib/server/team-account-workspace.loader';
export default function TasksPage() {
  const data = await loadTeamWorkspace();
  const permissions = data.account.permissions; // string[]
  const canWriteTasks = permissions.includes('tasks.write');
  return (
    <div>
      {canWriteTasks && <button>Create Task</button>}
      // other UI elements // ...
    </div>
  );
}
You can also pass the permissions list to the components that need it as a prop.

This way, you can gate access to certain UI elements based on the user's permissions.


import { loadTeamWorkspace } from '~/home/[account]/_lib/server/team-account-workspace.loader';
export default function TasksPage() {
  const data = await loadTeamWorkspace();
  const permissions = data.account.permissions; // string[]
  return (
    <div>
      <TaskList permissions={permissions} />
    </div>
  );
}
Similarly, you can use the permissions to gate access to certain routes or pages.


import { loadTeamWorkspace } from '~/home/[account]/_lib/server/team-account-workspace.loader';
export default function TasksPage() {
  const data = await loadTeamWorkspace();
  const permissions = data.account.permissions; // string[]
  if (!permissions.includes('tasks.read')) {
    return <ErrorPage message="You do not have permission to write tasks" />;
  }
  return (
    <div>
      <TaskList permissions={permissions} />
    </div>
  );
}
Easy as that!
##
Marketing Pages in the Next.js Supabase Turbo Starter Kit
Learn how to create and update marketing pages in the Next.js Supabase Turbo Starter Kit.
How to create and update marketing pages
Learn how to create and update marketing pages in the Next.js Supabase Turbo Starter Kit.

1
The marketing pages included in the Starter Kit

2
Adding a new marketing page

3
Customizing the layout

4
Adding a contact form

Makerkit comes with pre-defined marketing pages to help you get started with your SaaS application. These pages are built with Next.js and Tailwind CSS and are located in the apps/web/app/(marketing) directory.

The marketing pages included in the Starter Kit
Makerkit comes with the following marketing pages:

Home Page
Contact Form
Pricing Page
FAQ
Contact Page (with a contact form)
Legal Pages (Terms of Service, Privacy Policy, Cookie Policy)
Adding a new marketing page
To add a new marketing page to your Makerkit application, you need to follow these steps.

Create a folder in the apps/web/app/(marketing) directory with the path you want to use for the page. For example, to create a new page at /about, you would create a folder named about. Then, create the page file in the folder. For example, to create an about page, you would create an page.tsx file in the about folder.


// apps/web/app/(marketing)/about/page.tsx
export default function AboutPage() {
  return <div></div>
}
Customizing the layout
This page inherits the layout at apps/web/app/(marketing)/layout.tsx. You can customize the layout by editing this file - but remember that it will affect all marketing pages.

Contact Form
To make the contact form work, you need to add the following environment variables:


CONTACT_EMAIL=
In this variable, you need to set the email address where you want to receive the contact form submissions. The sender will be the same as the one configured in your mailing configuration.
##
Legal Pages in the Next.js Supabase Turbo Starter Kit
Learn how to create and update legal pages in the Next.js Supabase Turbo Starter Kit.
Legal pages in the Starter Kit
Learn how to create and update legal pages in the Next.js Supabase Turbo Starter Kit.

1
Includes pages in the Starter Kit

2
Using a CMS for legal pages

Includes pages in the Starter Kit
Legal pages are defined in the apps/web/app/(marketing)/(legal) directory.

Makerkit comes with the following legal pages:

Terms and Conditions: apps/web/app/(marketing)/(legal)/terms-and-conditions.mdx
Privacy Policy: apps/web/app/(marketing)/(legal)/privacy-policy.mdx
Cookie Policy: apps/web/app/(marketing)/(legal)/cookie-policy.mdx
For obvious reasons, these pages are empty and you need to fill in the content.

Do yourself a favor and do not use ChatGPT to generate these pages.

Using a CMS for legal pages
You can use a CMS to manage the content of the legal pages. To do this, use the CMS Client:


import { createCmsClient } from '@kit/cms';
export async function MyPage() {
  const cms = await createCmsClient();
  const { title, content } = await cms.getContentBySlug({
    slug: `slug`,
    collection: `pages`
  });
  return (
    <div>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
##
External Marketing Website in the Next.js Supabase Turbo Starter Kit
Learn how to configure Makerkit to work with an external marketing website in the Next.js Supabase Turbo Starter Kit.
Many teams prefer to create an external marketing website for their SaaS application. This allows them to have more control over the design and content of the website. For example, using services such as Framer, Webflow, or Wordpress.

In this case, we have to redirect all marketing pages to the external marketing website. You can do so tweaking the middleware in the apps/web/middleware.ts file.

Take the list of all your marketing pages, and then add a middleware to redirect all those pages to the external marketing website.


import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  if (isMarketingPage(req)) {
    return NextResponse.redirect('https://your-external-website.com' + req.nextUrl.pathname);
  }
  // leave the rest of the middleware unchanged
}
function isMarketingPage(req: NextRequest) {
  const marketingPages = [
    '/pricing',
    '/faq',
    '/contact',
    '/about',
    '/product',
    '/privacy-policy',
    '/terms-and-conditions',
    '/cookie-policy',
  ];
  return marketingPages.includes(req.nextUrl.pathname);
}
Should you add a new marketing page, you need to update the isMarketingPage function with the new page path.
##
SEO - Improve your Next.js application's search engine optimization"
Learn how to improve your Makerkit application's search engine optimization (SEO)
How to improve your Makerkit application's SEO
Learn how to improve your Makerkit application's search engine optimization (SEO)

1
Best Practices for SEO

2
Adding pages to the sitemap

3
Adding your website to Google Search Console

4
Backlinks

5
Content

6
Indexing and ranking take time

SEO is an important part of building a website. It helps search engines understand your website and rank it higher in search results. In this guide, you'll learn how to improve your Makerkit application's search engine optimization (SEO).

Best Practices for SEO
Makerkit is already optimized for SEO out of the box. However, there are a few things you can do to improve your application's SEO:

Content: The most important thing you can do to improve your application's SEO is to create high-quality content. No amount of technical optimization can replace good content. Make sure your content is relevant, useful, and engaging - and make sure it's updated regularly.
Write content helpful to your customers: To write good content, the kit comes with a blog and documentation feature. You can use these features to create high-quality content that will help your website rank higher in search results - and help your customers find what they're looking for.
Use the correct keywords: Use descriptive titles and meta descriptions for your pages. Titles and meta descriptions are the first things users see in search results, so make sure they are descriptive and relevant to the content on the page. Use keywords that your customers are likely to search for.
Optimize images: Use descriptive filenames and alt text for your images. This helps search engines understand what the image is about and can improve your website's ranking in image search results.
Website Speed: This is much less important than it used to be, but it's still a factor. Make sure your website loads quickly and is mobile-friendly. You can use tools like Google's PageSpeed Insights to check your website's speed and get suggestions for improvement. Optimize all images and assets to reduce load times.
Mobile Optimization: Make sure your website is mobile-friendly. Google ranks mobile-friendly websites higher in search results. You can use Google's Mobile-Friendly Test to check if your website is mobile-friendly.
Sitemap and Robots.txt: Makerkit generates a sitemap and robots.txt file for your website. These files help search engines understand your website's structure and what pages they should index. Make sure to update the sitemap as you add new pages to your website.
Backlinks: Backlinks are links from other websites to your website. It's touted to be the single most important factor in SEO these days. The more backlinks you have from high-quality websites, the higher your website will rank in search results. You can get backlinks by creating high-quality content that other websites want to link to.
Adding pages to the sitemap
Generally speaking, Google will find your pages without a sitemap as it follows the link in your website. However, you can add pages to the sitemap by adding them to the apps/web/app/server-sitemap.xml/route.ts route, which is used to generate the sitemap.

If you add more static pages to your website, you can add them to the getPaths function in the apps/web/app/server-sitemap.xml/route.ts file. For example, if you add a new page at /about, you can add it to the getPaths function like this:

apps/web/app/server-sitemap.xml/route.ts

function getPaths() {
 const paths = [
   '/',
   '/faq',
   '/blog',
   '/docs',
   '/pricing',
   '/contact',
   '/cookie-policy',
   '/terms-of-service',
   '/privacy-policy',
   // add more paths here,
   '/about', // <-- add the new page here
 ];
 return paths.map((path) => {
   return {
     loc: new URL(path, appConfig.url).href,
     lastmod: new Date().toISOString(),
   };
 });
}
All the blog and documentation pages are automatically added to the sitemap. You don't need to add them manually.

Adding your website to Google Search Console
Once you've optimized your website for SEO, you can add it to Google Search Console. Google Search Console is a free tool that helps you monitor and maintain your website's presence in Google search results.

You can use it to check your website's indexing status, submit sitemaps, and get insights into how Google sees your website.

The first thing you need to do is verify your website in Google Search Console. You can do this by adding a meta tag to your website's HTML or by uploading an HTML file to your website.

Once you've verified your website, you can submit your sitemap to Google Search Console. This will help Google find and index your website's pages faster.

Please submit your sitemap to Google Search Console by going to the Sitemaps section and adding the URL of your sitemap. The URL of your sitemap is https://your-website.com/server-sitemap.xml.

Of course, please replace your-website.com with your actual website URL.

Backlinks
Backlinks are said to be the most important factor in modern SEO. The more backlinks you have from high-quality websites, the higher your website will rank in search results - and the more traffic you'll get.

How do you get backlinks? The best way to get backlinks is to create high-quality content that other websites want to link to. However, you can also get backlinks by:

Guest posting: Write guest posts for other websites in your niche. This is a great way to get backlinks and reach a new audience.
Link building: Reach out to other websites and ask them to link to your website. You can offer to write a guest post or provide a testimonial in exchange for a backlink.
Social media: Share your content on social media to reach a wider audience and get more backlinks.
Directories: Submit your website to online directories to get backlinks. Make sure to choose high-quality directories that are relevant to your niche.
All these methods can help you get more backlinks and improve your website's SEO - and help you rank higher in search results.

Content
When it comes to internal factors, content is king. Make sure your content is relevant, useful, and engaging. Make sure it's updated regularly and optimized for SEO.

What should you write about? Most importantly, you want to think about how your customers will search for the problem your SaaS is solving. For example, if you're building a project management tool, you might want to write about project management best practices, how to manage a remote team, or how to use your tool to improve productivity.

You can use the blog and documentation features in Makerkit to create high-quality content that will help your website rank higher in search results - and help your customers find what they're looking for.

Indexing and ranking take time
New websites can take a while to get indexed by search engines. It can take anywhere from a few days to a few weeks (in some cases, even months!) for your website to show up in search results. Be patient and keep updating your content and optimizing your website for search engines.

By following these tips, you can improve your Makerkit application's search engine optimization (SEO) and help your website rank higher in search results. Remember, SEO is an ongoing process, so make sure to keep updating your content and optimizing your website for search engines. Good luck!
##

