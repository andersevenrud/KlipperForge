import { getDb } from "../client";

interface RevisionRow {
  config_id: string;
  revision_number: number;
  comment: string | null;
  document: string;
  document_size: number;
  created_at: string;
}

interface RevisionMetadata {
  config_id: string;
  revision_number: number;
  comment: string | null;
  document_size: number;
  created_at: string;
}

export function listRevisions(configId: string): RevisionMetadata[] {
  const db = getDb();
  return db
    .query<RevisionMetadata, [string]>(
      "SELECT config_id, revision_number, comment, document_size, created_at FROM revisions WHERE config_id = ? ORDER BY revision_number DESC",
    )
    .all(configId);
}

export function getRevision(configId: string, revisionNumber: number): RevisionRow | null {
  const db = getDb();
  return db
    .query<RevisionRow, [string, number]>("SELECT * FROM revisions WHERE config_id = ? AND revision_number = ?")
    .get(configId, revisionNumber);
}
