"""Create a local upload key once. Never upload the signing directory to GitHub."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parent.parent
java_home = Path(os.environ['JAVA_HOME']) if os.environ.get('JAVA_HOME') else Path((root / 'android-tools/java-home.txt').read_text().strip())
keytool = str(java_home / 'bin/keytool')
private = root / 'android/signing'
private.mkdir(mode=0o700, exist_ok=True)
private.chmod(0o700)
key = private / 'upload-key.jks'
password = private / 'upload-password.txt'
if not key.exists():
    if password.exists():
        raise SystemExit('Existing password without key. Inspect signing directory before proceeding.')
    password.write_text(secrets.token_urlsafe(48) + '\n')
    password.chmod(0o600)
    subprocess.run([keytool, '-genkeypair', '-alias', 'upload', '-keyalg', 'RSA', '-keysize', '3072',
                    '-validity', '10000', '-dname', 'CN=Poop PR Upload, O=Poop PR, C=KR',
                    '-keystore', str(key), '-storetype', 'JKS', '-storepass:file', str(password),
                    '-keypass:file', str(password), '-noprompt'], check=True, capture_output=True)
    key.chmod(0o600)
elif not password.exists():
    raise SystemExit('Existing key has no password file. Do not create a replacement key.')
certificate = private / 'upload-certificate.der'
subprocess.run([keytool, '-exportcert', '-alias', 'upload', '-keystore', str(key),
                '-storepass:file', str(password), '-file', str(certificate)], check=True, capture_output=True)
fingerprint = ':'.join(f'{byte:02X}' for byte in hashlib.sha256(certificate.read_bytes()).digest())
(private / 'upload-certificate-sha256.txt').write_text(fingerprint + '\n')
links = root / 'public/.well-known/assetlinks.json'
links.parent.mkdir(parents=True, exist_ok=True)
if not links.exists():
    links.write_text(json.dumps([{'relation': ['delegate_permission/common.handle_all_urls'],
        'target': {'namespace': 'android_app', 'package_name': 'com.ahkang.pooppr',
                   'sha256_cert_fingerprints': [fingerprint]}}], indent=2) + '\n')
print('Local upload key ready. Only the public certificate fingerprint is included in the website.')
