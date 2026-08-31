# NÜ-LINE Digital Book Website — Version 3.6

Version 3.6 preserves the live website, brochure artwork, contact form and Supabase enquiry connection while adding gated brochure downloads and completing the Hansen Products expansion.

## Hansen expansion

- Adds two new brochure pages before Residence 9.
- Moves Residence 9 and all following pages forward by two positions.
- Uses official Hansen project imagery and branding supplied by the user.
- Describes the products accurately as aluminium systems with a steel-look aesthetic.
- Adds a crawlable, search-focused Hansen landing page for Scotland.
- Adds Hansen to the project-enquiry system choices.
- Includes all five assets required by the dedicated Hansen landing page.

## Brochure lead capture

- Adds a visible Brochures action to the main navigation.
- Requests the visitor's name, company, email, telephone, role and area of interest.
- Saves each successful request to the existing `website_enquiries` register.
- Unlocks Edition I, Hansen and HYLINE downloads after successful submission.
- Includes web-sized PDFs for Edition I and the Hansen 2026 product range.
- Updates cache-busting and the service-worker cache to Version 3.6.

Deploy all files together so browsers receive the new JavaScript and service worker.
The new Hansen images and brochure PDFs are intentionally stored at the repository root so they can be uploaded easily from a phone.
