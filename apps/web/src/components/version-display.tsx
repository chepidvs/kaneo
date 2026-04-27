export function VersionDisplay() {
  const changelogUrl =
    "https://github.com/chepidvs/kaneo/blob/main/CHANGELOG.md";

  return (
    <div className="flex items-center justify-center px-2 py-1.5">
      <a
        href={changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        v2.7.0 | FRMWRK
      </a>
    </div>
  );
}
