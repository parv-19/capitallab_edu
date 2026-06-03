import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface CourseDocumentDoc {
  id: string;
  _id: string;
  courseId: string;
  courseName?: string | null;
  course?: string | null;
  title: string;
  name?: string | null;
  originalName?: string | null;
  originalFileName: string;
  mimeType?: string | null;
  filePath: string;
  fileUrl?: string | null;
  fileType: string;
  size: number;
  subject: string;
  chapter?: string | null;
  chapterName?: string | null;
  level?: string | null;
  tags: string[];
  uploadedBy?: string | null;
  status: "uploaded" | "processing" | "completed" | "indexed" | "failed";
  chunkCount: number;
  totalChunks: number;
  chunksCount: number;
  processedForAI: boolean;
  embeddingProvider?: string | null;
  errorMessage?: string | null;
  processingError?: string | null;
  processedAt?: Date | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
}

function makeDoc(row: any): CourseDocumentDoc {
  const d: any = mapRow(row);
  d.tags = d.tags ?? [];
  d.chunkCount = d.chunkCount ?? 0;
  d.totalChunks = d.totalChunks ?? 0;
  d.chunksCount = d.chunksCount ?? 0;
  d.processedForAI = d.processedForAI ?? false;
  d.save = async () => {
    await pool.query(
      `UPDATE course_documents SET
        course_id=$1, course_name=$2, title=$3, name=$4, original_name=$5,
        original_file_name=$6, mime_type=$7, file_path=$8, file_url=$9, file_type=$10,
        size=$11, subject=$12, chapter=$13, chapter_name=$14, level=$15, tags=$16,
        uploaded_by=$17, status=$18, chunk_count=$19, total_chunks=$20, chunks_count=$21,
        processed_for_ai=$22, embedding_provider=$23, error_message=$24,
        processing_error=$25, processed_at=$26
       WHERE id=$27`,
      [
        d.courseId, d.courseName ?? null, d.title, d.name ?? null, d.originalName ?? null,
        d.originalFileName, d.mimeType ?? null, d.filePath, d.fileUrl ?? null, d.fileType,
        d.size, d.subject, d.chapter ?? null, d.chapterName ?? null, d.level ?? null,
        d.tags, d.uploadedBy ?? null, d.status, d.chunkCount, d.totalChunks, d.chunksCount,
        d.processedForAI, d.embeddingProvider ?? null, d.errorMessage ?? null,
        d.processingError ?? null, d.processedAt ?? null, d.id,
      ],
    );
  };
  return d as CourseDocumentDoc;
}

export const CourseDocument = {
  async findById(id: string): Promise<CourseDocumentDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM course_documents WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<CourseDocumentDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM course_documents ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<CourseDocumentDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM course_documents ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<CourseDocumentDoc> {
    const { rows } = await pool.query(
      `INSERT INTO course_documents
         (course_id,course_name,title,name,original_name,original_file_name,mime_type,
          file_path,file_url,file_type,size,subject,chapter,chapter_name,level,tags,
          uploaded_by,status,chunk_count,total_chunks,chunks_count,processed_for_ai,
          embedding_provider)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`,
      [
        data.courseId, data.courseName ?? null, data.title, data.name ?? null,
        data.originalName ?? null, data.originalFileName, data.mimeType ?? null,
        data.filePath, data.fileUrl ?? null, data.fileType, data.size ?? 0,
        data.subject ?? "General", data.chapter ?? null, data.chapterName ?? null,
        data.level ?? null, data.tags ?? [], data.uploadedBy ?? null,
        data.status ?? "uploaded", data.chunkCount ?? 0, data.totalChunks ?? 0,
        data.chunksCount ?? 0, data.processedForAI ?? false, data.embeddingProvider ?? null,
      ],
    );
    return makeDoc(rows[0]);
  },

  async findOneAndDelete(filter: Record<string, any>): Promise<CourseDocumentDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(
      `DELETE FROM course_documents ${where} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async deleteMany(filter: Record<string, any>): Promise<void> {
    const { where, params } = buildWhere(filter);
    await pool.query(`DELETE FROM course_documents ${where}`, params);
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<CourseDocumentDoc | null> {
    const { sets, params } = buildSet(update);
    if (!sets) return this.findById(id);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE course_documents SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },
};
