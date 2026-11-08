"""Export only reviewed, tracked course files to the public Pages artifact."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIRS = {'01_Course_Info', '02_Lecture_Slides', '03_Assignments',
               '04_Project', '05_Announcements', '06_Recordings', '07_Assignment_2_Lab'}
PUBLIC_FILES = {'index.html', '.nojekyll', 'README.md', 'resources_manifest.csv'}
BLOCKED_PARTS = {'My_Submission', 'Feedback', '_processing', '.local-private', 'research'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audit-only', action='store_true')
    args = parser.parse_args()
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
    selected = []
    for name in filter(None, tracked):
        relative = Path(name)
        if BLOCKED_PARTS.intersection(relative.parts) or name == 'download_manifest.csv':
            raise SystemExit('A local-only file is tracked: ' + name)
        if relative.name.startswith('.env') or '.partial.' in relative.name:
            raise SystemExit('A local-only file is tracked: ' + name)
        source = ROOT / relative
        if source.is_symlink():
            raise SystemExit('Symlinks are not supported in the public export')
        if source.stat().st_size > 100 * 1024 * 1024:
            raise SystemExit('File exceeds individual-file limit: ' + name)
        if relative.parts[0] in PUBLIC_DIRS or name in PUBLIC_FILES:
            selected.append((relative, source))
    total = sum(source.stat().st_size for _, source in selected)
    if total >= 950_000_000:
        raise SystemExit('Public artifact is too close to the Pages size limit')
    if not args.audit_only:
        output = ROOT / '_site'
        output.mkdir(exist_ok=True)
        for relative, source in selected:
            target = output / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    print(json.dumps({'public_files': len(selected), 'public_bytes': total,
                      'personal_work_excluded': True, 'audit_only': args.audit_only}, indent=2))


if __name__ == '__main__':
    main()
