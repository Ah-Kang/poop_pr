"""Sign a CI-built AAB locally, without disclosing credentials to CI or logs."""
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
java_home = Path(os.environ['JAVA_HOME']) if os.environ.get('JAVA_HOME') else Path((root / 'android-tools/java-home.txt').read_text().strip())
private = root / 'android/signing'
source = Path(sys.argv[1]).resolve()
destination = Path(sys.argv[2]).resolve()
if source == destination:
    raise SystemExit('Use a separate destination to preserve the unsigned build.')
if destination.exists():
    raise SystemExit('Destination already exists; use a new versioned filename.')
destination.parent.mkdir(parents=True, exist_ok=True)
subprocess.run([str(java_home / 'bin/jarsigner'), '-keystore', str(private / 'upload-key.jks'),
    '-storepass:file', str(private / 'upload-password.txt'), '-keypass:file', str(private / 'upload-password.txt'),
    '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', '-signedjar', str(destination), str(source), 'upload'],
    check=True, capture_output=True)
verified = subprocess.run([str(java_home / 'bin/jarsigner'), '-J-Duser.language=en', '-verify', str(destination)],
    check=True, capture_output=True, text=True)
if 'jar verified.' not in verified.stdout:
    raise SystemExit('Bundle signature verification failed.')
print('Signed bundle verified:', destination)
