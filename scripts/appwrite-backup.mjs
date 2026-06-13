import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import {
  Client,
  Databases,
  Query,
  Storage,
  TablesDB,
  Users,
} from 'node-appwrite';

dotenv.config();

const PAGE_SIZE = Number(process.env.APPWRITE_BACKUP_PAGE_SIZE || 100);
const BACKUP_ROOT = path.resolve('backup');

const requiredEnv = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
];

const placeholderPatterns = [/^your_/i, /^replace_/i, /^changeme$/i, /^todo$/i];

function looksPlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(String(value || '').trim()));
}

function loadFirstRealServerEnv() {
  const envFile = path.resolve('.env');
  return fs.readFile(envFile, 'utf8')
    .then((contents) => {
      const firstReal = {};
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

        const [key, ...parts] = trimmed.split('=');
        if (!key.startsWith('APPWRITE_')) continue;

        const value = parts.join('=').trim();
        if (!looksPlaceholder(value) && !firstReal[key]) {
          firstReal[key] = value;
        }
      }

      for (const key of requiredEnv) {
        if (firstReal[key]) {
          process.env[key] = firstReal[key];
        }
      }

      if (firstReal.APPWRITE_DATABASE_ID) {
        process.env.APPWRITE_DATABASE_ID = firstReal.APPWRITE_DATABASE_ID;
      }

      if (
        (!process.env.APPWRITE_API_KEY || looksPlaceholder(process.env.APPWRITE_API_KEY)) &&
        firstReal.APPWRITE_READ_ONLY_KEY
      ) {
        process.env.APPWRITE_API_KEY = firstReal.APPWRITE_READ_ONLY_KEY;
      }
    })
    .catch(() => {});
}

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  for (const key of requiredEnv) {
    const value = String(process.env[key] || '').trim();
    if (looksPlaceholder(value)) {
      throw new Error(`${key} still looks like a placeholder. Refusing to run.`);
    }
  }
}

function createClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  return {
    databases: new Databases(client),
    storage: new Storage(client),
    tables: new TablesDB(client),
    users: new Users(client),
  };
}

function safeName(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function withoutUndefined(value) {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => typeof item !== 'undefined')
        .map(([key, item]) => [key, withoutUndefined(item)])
    );
  }
  return value;
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(withoutUndefined(data), null, 2)}\n`, 'utf8');
}

async function paginate(fetchPage, getItems, cursorField = '$id') {
  const items = [];
  let cursor = null;

  for (;;) {
    const queries = [Query.limit(PAGE_SIZE)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await fetchPage(queries);
    const pageItems = getItems(response);
    items.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) {
      return { items, total: response.total ?? items.length };
    }

    cursor = pageItems.at(-1)?.[cursorField] || pageItems.at(-1)?.$id;
    if (!cursor) {
      return { items, total: response.total ?? items.length };
    }
  }
}

async function verifyConnection({ databases, storage, users }) {
  const [dbs, buckets, projectUsers] = await Promise.all([
    databases.list({ queries: [Query.limit(1)], total: false }),
    storage.listBuckets({ queries: [Query.limit(1)], total: false }),
    users.list({ queries: [Query.limit(1)], total: false }),
  ]);

  return {
    databasesReachable: Array.isArray(dbs.databases),
    storageReachable: Array.isArray(buckets.buckets),
    usersReachable: Array.isArray(projectUsers.users),
  };
}

async function exportUsers(users, outDir) {
  const { items, total } = await paginate(
    (queries) => users.list({ queries, total: false }),
    (response) => response.users || []
  );

  await writeJson(path.join(outDir, 'users', 'users.json'), items);
  return { totalReported: total, exported: items.length };
}

async function exportStorage(storage, outDir) {
  const { items: buckets, total } = await paginate(
    (queries) => storage.listBuckets({ queries, total: false }),
    (response) => response.buckets || []
  );

  await writeJson(path.join(outDir, 'storage', 'buckets.json'), buckets);

  const bucketSummaries = [];
  for (const bucket of buckets) {
    const bucketId = bucket.$id;
    const bucketDir = path.join(outDir, 'storage', 'buckets', safeName(bucketId));
    const { items: files, total: filesTotal } = await paginate(
      (queries) => storage.listFiles({ bucketId, queries, total: false }),
      (response) => response.files || []
    );

    await writeJson(path.join(bucketDir, 'bucket.json'), bucket);
    await writeJson(path.join(bucketDir, 'files.json'), files);

    bucketSummaries.push({
      bucketId,
      name: bucket.name,
      filesReported: filesTotal,
      filesExported: files.length,
    });
  }

  return {
    bucketsReported: total,
    bucketsExported: buckets.length,
    buckets: bucketSummaries,
  };
}

async function exportCollections(databases, database, outDir) {
  const databaseId = database.$id;
  const { items: collections, total } = await paginate(
    (queries) => databases.listCollections({ databaseId, queries, total: false }),
    (response) => response.collections || []
  );

  await writeJson(path.join(outDir, 'collections.json'), collections);

  const collectionSummaries = [];
  for (const collection of collections) {
    const collectionId = collection.$id;
    const collectionDir = path.join(outDir, 'collections', safeName(collectionId));

    const [attributesResult, indexesResult] = await Promise.all([
      paginate(
        (queries) => databases.listAttributes({ databaseId, collectionId, queries, total: false }),
        (response) => response.attributes || []
      ),
      paginate(
        (queries) => databases.listIndexes({ databaseId, collectionId, queries, total: false }),
        (response) => response.indexes || []
      ),
    ]);

    const { items: documents, total: docsTotal } = await paginate(
      (queries) => databases.listDocuments({ databaseId, collectionId, queries, total: false }),
      (response) => response.documents || []
    );

    await writeJson(path.join(collectionDir, 'collection.json'), collection);
    await writeJson(path.join(collectionDir, 'attributes.json'), attributesResult.items);
    await writeJson(path.join(collectionDir, 'indexes.json'), indexesResult.items);
    await writeJson(path.join(collectionDir, 'documents.json'), documents);

    collectionSummaries.push({
      collectionId,
      name: collection.name,
      documentsReported: docsTotal,
      documentsExported: documents.length,
      attributes: attributesResult.items.length,
      indexes: indexesResult.items.length,
    });
  }

  return {
    collectionsReported: total,
    collectionsExported: collections.length,
    collections: collectionSummaries,
  };
}

async function exportTables(tables, database, outDir) {
  const databaseId = database.$id;
  const summary = {
    available: true,
    tablesReported: 0,
    tablesExported: 0,
    tables: [],
  };

  let tablesResult;
  try {
    tablesResult = await paginate(
      (queries) => tables.listTables({ databaseId, queries, total: false }),
      (response) => response.tables || []
    );
  } catch (error) {
    summary.available = false;
    summary.reason = error.message;
    await writeJson(path.join(outDir, 'tables', 'tables-unavailable.json'), summary);
    return summary;
  }

  summary.tablesReported = tablesResult.total;
  summary.tablesExported = tablesResult.items.length;
  await writeJson(path.join(outDir, 'tables', 'tables.json'), tablesResult.items);

  for (const table of tablesResult.items) {
    const tableId = table.$id;
    const tableDir = path.join(outDir, 'tables', safeName(tableId));

    const [columnsResult, indexesResult] = await Promise.all([
      paginate(
        (queries) => tables.listColumns({ databaseId, tableId, queries, total: false }),
        (response) => response.columns || []
      ),
      paginate(
        (queries) => tables.listIndexes({ databaseId, tableId, queries, total: false }),
        (response) => response.indexes || []
      ),
    ]);

    const { items: rows, total: rowsTotal } = await paginate(
      (queries) => tables.listRows({ databaseId, tableId, queries, total: false }),
      (response) => response.rows || []
    );

    await writeJson(path.join(tableDir, 'table.json'), table);
    await writeJson(path.join(tableDir, 'columns.json'), columnsResult.items);
    await writeJson(path.join(tableDir, 'indexes.json'), indexesResult.items);
    await writeJson(path.join(tableDir, 'rows.json'), rows);

    summary.tables.push({
      tableId,
      name: table.name,
      rowsReported: rowsTotal,
      rowsExported: rows.length,
      columns: columnsResult.items.length,
      indexes: indexesResult.items.length,
    });
  }

  return summary;
}

async function exportDatabases(databases, tables, outDir) {
  const { items: databaseItems, total } = await paginate(
    (queries) => databases.list({ queries, total: false }),
    (response) => response.databases || []
  );

  if (
    process.env.APPWRITE_DATABASE_ID &&
    !looksPlaceholder(process.env.APPWRITE_DATABASE_ID) &&
    !databaseItems.some((database) => database.$id === process.env.APPWRITE_DATABASE_ID)
  ) {
    const configuredDatabase = await databases.get({ databaseId: process.env.APPWRITE_DATABASE_ID });
    databaseItems.push(configuredDatabase);
  }

  await writeJson(path.join(outDir, 'databases', 'databases.json'), databaseItems);

  const databaseSummaries = [];
  for (const database of databaseItems) {
    const databaseId = database.$id;
    const databaseDir = path.join(outDir, 'databases', safeName(databaseId));

    await writeJson(path.join(databaseDir, 'database.json'), database);

    const collections = await exportCollections(databases, database, databaseDir);
    const tablesSummary = await exportTables(tables, database, databaseDir);

    databaseSummaries.push({
      databaseId,
      name: database.name,
      ...collections,
      tables: tablesSummary,
    });
  }

  return {
    databasesReported: total,
    databasesExported: databaseItems.length,
    databases: databaseSummaries,
  };
}

async function main() {
  await loadFirstRealServerEnv();
  assertEnv();

  const startedAt = new Date();
  const runId = `appwrite-${startedAt.toISOString().replace(/[:.]/g, '-')}`;
  const outDir = path.join(BACKUP_ROOT, runId);
  const clients = createClient();

  console.log('Verifying Appwrite read-only connection...');
  const verification = await verifyConnection(clients);
  console.log('Connection verified. Starting read-only export...');

  const [databaseSummary, userSummary, storageSummary] = await Promise.all([
    exportDatabases(clients.databases, clients.tables, outDir),
    exportUsers(clients.users, outDir),
    exportStorage(clients.storage, outDir),
  ]);

  const finishedAt = new Date();
  const manifest = {
    runId,
    createdAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    endpoint: process.env.APPWRITE_ENDPOINT,
    projectId: process.env.APPWRITE_PROJECT_ID,
    backupPath: outDir,
    pageSize: PAGE_SIZE,
    verification,
    databases: databaseSummary,
    users: userSummary,
    storage: storageSummary,
    complete:
      verification.databasesReachable &&
      verification.storageReachable &&
      verification.usersReachable,
  };

  await writeJson(path.join(outDir, 'manifest.json'), manifest);
  await writeJson(path.join(BACKUP_ROOT, 'manifest.json'), manifest);

  console.log(`Backup complete: ${outDir}`);
  console.log(
    `Exported ${databaseSummary.databasesExported} databases, ${userSummary.exported} users, ${storageSummary.bucketsExported} storage buckets.`
  );
}

main().catch((error) => {
  console.error(`Backup failed: ${error.message}`);
  process.exitCode = 1;
});
