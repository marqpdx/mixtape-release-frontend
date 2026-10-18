# Add an HTML page to the writing editor’s Interactive Page menu

From the `mixtape-release-frontend` directory:

1. Put the reviewed HTML and its supporting files under `apps/crossroads/public/artifacts/your-page/`.
2. Run:

   ```bash
   bash scripts/add-interactive-page-with-png.sh apps/crossroads/public/artifacts/your-page/your-page.html
   ```

3. Review the generated sibling PNG and the change to `packages/content/src/topologyArtifacts.ts`.
4. Commit the HTML, supporting files, PNG and registry together. Deploy Crossroads to publish the files, and rebuild/deploy Mixtape to update the editor dropdown.

The command reads the HTML `<title>`, generates a full-page light PNG at 1280 CSS pixels and 2× resolution, and registers the page. No backend changes or runtime rendering are needed. The PNG is a static preview; the original HTML stays interactive when opened through Dissolve or its standalone URL.

## Choose the menu title

```bash
bash scripts/add-interactive-page-with-png.sh apps/crossroads/public/artifacts/your-page/your-page.html --title "My interactive page"
```

IDs are derived from the artifact path. Supply `--id my-page` if you want a shorter ID. Existing IDs stay unchanged on refresh so saved articles keep working.

## Refresh after editing the HTML

```bash
bash scripts/add-interactive-page-with-png.sh apps/crossroads/public/artifacts/platform/platform-topology.html --refresh --force
```

`--refresh` keeps the existing entry and title; add `--title` to change the menu title. It does not rename titles already saved in articles. `--force` explicitly permits replacing the PNG. Existing images are never replaced without that flag.

## Check the plan first

Add `--dry-run` to validate the input and print the planned URLs without rendering or changing files. Include `--force` in the plan if the PNG already exists.

## Capture options

- Default full-page capture works for Platform Topology and other standalone pages.
- `--topology` crops topology-kit pages, such as System and Loom, to their header and diagram. Do not use it for Platform’s different layout.
- `--selector '.my-diagram'` captures a specific element instead.
- `--width 1440` and `--scale 2` control capture size and density.
- `--help` lists all options.

The helper uses the existing sibling `puddlejump/zz/html-to-png.sh` and the frontend’s installed Playwright/Chromium. It does not install dependencies, commit, push or deploy. Rendering runs the supplied HTML’s JavaScript and may load its external fonts or assets; use reviewed HTML.

To insert without a preset, the editor also offers **Another interactive page**: enter the published HTML and PNG URLs manually.
