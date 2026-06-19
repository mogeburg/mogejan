import fs from "node:fs/promises";
import path from "node:path";

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function sortVersionsDesc(versions) {
  return [...versions].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }),
  );
}

function versionZipName(version) {
  return `mogejan-${version}.zip`;
}

function renderExtraLatestLink(index) {
  if (index !== 0) {
    return "";
  }

  return `
            <div class="version-extra-links">
              <a class="version-extra-link" href="https://mogejan.netlify.app/" target="_blank" rel="noopener noreferrer">v0.0111</a>
            </div>`;
}

function renderVersionLinks(versions) {
  if (versions.length === 0) {
    return `<p class="empty">まだ公開済みバージョンはありません。</p>`;
  }

  return versions
    .map(
      (version, index) => `
        <li class="version-row">
          <div>
            <div class="version-name">${version}</div>
            <div class="version-meta">Static build archive</div>
            ${renderExtraLatestLink(index)}
          </div>
          <div class="actions">
            <a class="button" href="./${version}/">Play</a>
            <a class="button button-subtle" href="./${versionZipName(version)}">ZIP</a>
          </div>
        </li>`,
    )
    .join("");
}

async function main() {
  const versionsDir = process.argv[2];

  if (!versionsDir) {
    throw new Error("Usage: node scripts/render-pages-index.mjs <versionsDir>");
  }

  const versions = (await exists(versionsDir))
    ? sortVersionsDesc(
        (await fs.readdir(versionsDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name),
      )
    : [];

  const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>もげじゃん Versions</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --panel: rgba(255, 252, 248, 0.96);
        --text: #2d241d;
        --muted: #6f6258;
        --line: rgba(88, 66, 51, 0.15);
        --accent: #c0392b;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Hiragino Sans", "BIZ UDPGothic", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(214, 92, 62, 0.18), transparent 32%),
          radial-gradient(circle at top right, rgba(78, 127, 91, 0.18), transparent 28%),
          linear-gradient(180deg, #f8f2e9 0%, var(--bg) 100%);
      }

      main {
        width: min(960px, calc(100vw - 32px));
        margin: 32px auto 48px;
      }

      .panel {
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 5vw, 48px);
        line-height: 1.08;
      }

      .lead {
        margin: 12px 0 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .back-link {
        display: inline-flex;
        margin-top: 14px;
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }

      .version-list {
        list-style: none;
        padding: 0;
        margin: 24px 0 0;
        display: flex;
        flex-direction: column;
      }

      .version-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 0;
        border-top: 1px solid var(--line);
      }

      .version-name {
        font-size: 18px;
        font-weight: 700;
      }

      .version-meta,
      .empty {
        color: var(--muted);
      }

      .version-extra-links {
        margin-top: 8px;
      }

      .version-extra-link {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }

      .version-extra-link:hover {
        text-decoration: underline;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 700;
        color: #fff;
        background: var(--accent);
      }

      .button-subtle {
        color: var(--text);
        background: #fff;
        border: 1px solid var(--line);
      }

      @media (max-width: 760px) {
        main {
          width: min(100vw - 20px, 960px);
          margin-top: 20px;
        }

        .panel {
          padding: 18px;
          border-radius: 14px;
        }

        .version-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <h1>もげじゃん バージョン一覧</h1>
        <a class="back-link" href="../">最新版</a>
        <ul class="version-list">
          ${renderVersionLinks(versions)}
        </ul>
      </section>
    </main>
  </body>
</html>`;

  await fs.mkdir(versionsDir, { recursive: true });
  await fs.writeFile(path.join(versionsDir, "index.html"), html, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
