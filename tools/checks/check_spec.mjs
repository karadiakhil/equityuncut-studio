// Re-export of the V0 CLI so both paths named in the upgrade spec work.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'check_spec.mjs');
const r = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {stdio: 'inherit'});
process.exit(r.status == null ? 1 : r.status);
