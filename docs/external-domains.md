# External domains

## Runtime

| Domain | Purpose | Decision |
| --- | --- | --- |
| `https://finance.bloome.im` | Device authorization, entitlements, research gateway, run lifecycle, and report publishing | Keep. This replaces the temporary source-project endpoint. The new index must stay behind this gateway; do not expose an index host in the plugin. |
| `https://fonts.googleapis.com` | Workbench font stylesheet | Keep unless offline or stricter privacy requirements justify bundling fonts. |
| `https://fonts.gstatic.com` | Workbench font files | Keep with the Google Fonts stylesheet. |
| Dynamic presigned upload host | Private report upload | Keep dynamic. Bloome Finance returns the URL and required headers at runtime. |

`BLOOME_FINANCE_URL` remains the only configurable service origin for local development. Production retrieval strategy and index selection belong in the authenticated Finance backend, so switching indexes does not require another plugin domain.

## Metadata and development only

- `https://github.com/ArcoCodes/bloome-finance-plugin`: repository metadata; updated for this project.
- `https://json.schemastore.org` and `https://json-schema.org`: manifest/schema identifiers; no production research traffic.
- `https://bloome.dev/schemas/plugin-config.schema.json`: schema identifier only; no change required.
- `*.example` domains occur only in tests.
