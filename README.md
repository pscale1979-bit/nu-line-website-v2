# NÜ-LINE Digital Book Website — Version 3.3

Version 3.3 preserves the working website, contact form and Supabase enquiry connection.

## Version 3.3 native-pixel canvas renderer

- Paints the landing cover and brochure pages into HTML canvas elements.
- Keeps each canvas backing store at the JPG's original pixel dimensions.
- Displays canvases at whole CSS-pixel sizes with high-quality smoothing.
- Avoids Safari repeatedly rasterising and resizing a normal image layer.
- Retains the Version 3.2 mobile layout, navigation, contents and enquiry workflow.
- Updates cache-busting and the service-worker cache to Version 3.3.

## Deployment

Upload all extracted files together to the `nu-line-website-v2` repository and commit directly to `main`. Files with matching names will be replaced; there is no need to delete the existing files first. Vercel should deploy automatically.
