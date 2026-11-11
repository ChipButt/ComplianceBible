# Compliance Bible by Chip In Works

This branch contains the Chip In branded preview of the full Compliance Bible interface. The desktop sidebar and compact mobile navigation cover Home, Checks, Documents, Logs, Users, Rota, Inspection and Settings.

For GitHub Pages, select this branch and the root directory. To run locally, use `python3 -m http.server 8108` from the repository root.

Use synthetic data in a preview. The full interface still uses the prototype's browser storage and profile selection. Production accounts, company isolation and hosted evidence storage are separate implementation work. The rota view loads its existing external schedule resources.

The Chip In wordmark and compact mark come from the ChipButt/ChipIn repository.

## Cloudflare Pages and Supabase development build

The Cloudflare build serves the signed-in opening-check workflow and the full owner workspace.
The owner workspace uses the original eight sections and stores a versioned snapshot per premises in Supabase. Legacy profile switching remains local to this workspace and does not grant app login or database permissions.
Staff and managers use the signed-in opening-check and records workflow.

To carry over browser records, use **Export app data** on the original GitHub Pages site in the browser profile that holds them. On the signed-in Cloudflare site, choose the destination premises, then use **Import original app backup** before the first workspace save. The export contains workspace data, not Supabase login credentials. Opening-check records created in the signed-in workflow are kept in their existing table.

The development workspace stores legacy evidence with its snapshot. Opening-check photos submitted through the signed-in workflow use private Supabase Storage.

1. Apply the checked-in migration to the intended Supabase development project.
2. Create staff accounts in Supabase Auth. As an administrator, create rows in `cb_companies` and `cb_premises`, then assign each Auth user a row in `cb_memberships` with the matching company and premises, a display name, and a role.
3. Connect this repository and branch in Cloudflare Pages. Use `npm run build` and output directory `dist`.
4. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the Pages build environment. The generated frontend embeds the publishable key. Keep service-role keys out of the build.
5. In development, sign in as an assigned staff member, complete one check with sample evidence, then review it using a manager account assigned to the same premises.

Locally, run `npm ci` and `npm run build` with the same environment variables. Serve the `dist` directory with a static server. A build without a project connection displays a setup message.

Records are append-only for signed-in clients. The database supplies the actor and timestamp and allows one opening check per premises per Europe/London calendar day. The private evidence bucket limits images to 5 MB. Development project administrators can clean up orphaned uploads after failed submissions. Accounts, browser-local data, and other modules from the legacy prototype have not been migrated into this workflow.
