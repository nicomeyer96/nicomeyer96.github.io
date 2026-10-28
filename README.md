# Nico Meyer

Source for my [personal academic website](https://nicomeyer96.github.io/),
built with [Quarto](https://quarto.org/). The site covers my research in
quantum computing, quantum error correction, and machine learning, along with
publications, software, talks, projects, and awards.

## Build locally

Install Quarto, then run from the repository root:

```powershell
quarto preview
```

To generate the static site without starting a preview server:

```powershell
quarto render
```

Rendered files in `_site/` are excluded from Git. The `update-software.ts`
pre-render script updates the software page using public GitHub star counts.
When the GitHub API rate limit is exhausted, it retains the last generated
counts until a later render.

## GitHub Pages setup

After pushing the repository to `main`, publish the rendered site:

```powershell
quarto publish gh-pages
```

In the repository's **Settings → Pages**, select **Deploy from a branch**
with `gh-pages` and `/(root)` as the publishing source. Pushing to `main`
alone does not update the live site.

## Update the website

From the repository root, edit the source files, then render and review the
site locally. Quarto's pre-render script may also update `software.qmd`:

```powershell
quarto render
git status --short
git add .
git diff --cached --stat
git commit -m "Update website"
git push origin main
quarto publish gh-pages
```

Check the staged files before committing, especially when adding new images.
The push updates the source on `main`; `quarto publish gh-pages` renders and
pushes the live site to `gh-pages`. Check
[the published website](https://nicomeyer96.github.io/) after deployment.

## Content and figures

Publication figures have individual source and rights information in their
captions. Copyright notices and links to publisher reuse terms are
attributions, not blanket licenses for those images.
