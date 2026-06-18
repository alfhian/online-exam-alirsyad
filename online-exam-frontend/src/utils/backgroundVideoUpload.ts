const DB_NAME = "exam-video-upload-queue";
const DB_VERSION = 1;
const STORE_NAME = "uploads";
const MAX_ATTEMPTS = 5;
const PERMANENT_FAILURE_STATUSES = new Set([400, 401, 403, 404, 413]);

type UploadJob = {
  id: string;
  sessionId: string;
  blob: Blob;
  fileName: string;
  token: string;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  availableAt: number;
  lastError?: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;
let processing = false;
let started = false;

const openDb = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

const runStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | T,
) => {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = callback(store);

    if (result instanceof IDBRequest) {
      result.onerror = () => reject(result.error);
    }

    transaction.oncomplete = () => {
      if (result instanceof IDBRequest) {
        resolve(result.result);
      } else {
        resolve(result);
      }
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

const getAllJobs = () => runStore<UploadJob[]>("readonly", (store) => store.getAll());
const saveJob = (job: UploadJob) => runStore<IDBValidKey>("readwrite", (store) => store.put(job));
const deleteJob = (id: string) => runStore<undefined>("readwrite", (store) => store.delete(id));

const uploadJob = async (job: UploadJob) => {
  const token = localStorage.getItem("token") || job.token;
  if (!token) throw new Error("Token tidak tersedia untuk upload rekaman");

  const formData = new FormData();
  formData.append("file", job.blob, job.fileName || "exam-recording.webm");

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/exam-sessions/${job.sessionId}/upload-video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(text || `Upload rekaman gagal (${response.status})`);
    (error as Error & { status?: number; permanent?: boolean }).status = response.status;
    (error as Error & { status?: number; permanent?: boolean }).permanent =
      PERMANENT_FAILURE_STATUSES.has(response.status);
    throw error;
  }
};

export const processVideoUploadQueue = async () => {
  if (processing) return;
  processing = true;

  try {
    const jobs = await getAllJobs();
    for (const job of jobs) {
      const attempts = Number(job.attempts || 0);
      const availableAt = Number(job.availableAt || 0);
      if (attempts >= MAX_ATTEMPTS || availableAt > Date.now()) continue;

      try {
        await uploadJob(job);
        await deleteJob(job.id);
      } catch (error) {
        const uploadError = error as Error & { permanent?: boolean };
        if (uploadError.permanent) {
          console.error("Upload rekaman gagal permanen:", uploadError.message);
          await deleteJob(job.id);
          continue;
        }

        await saveJob({
          ...job,
          attempts: attempts + 1,
          lastError: error instanceof Error ? error.message : String(error),
          availableAt: Date.now() + Math.min(60000, 1000 * 2 ** attempts),
          updatedAt: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error("Gagal memproses queue upload rekaman:", error);
  } finally {
    processing = false;
  }
};

export const enqueueVideoUpload = async ({
  sessionId,
  blob,
  fileName = "exam-recording.webm",
}: {
  sessionId: string;
  blob: Blob;
  fileName?: string;
}) => {
  if (!sessionId || !blob || blob.size === 0) return null;

  const job: UploadJob = {
    id: `${sessionId}-${Date.now()}`,
    sessionId,
    blob,
    fileName,
    token: localStorage.getItem("token") || "",
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    availableAt: Date.now(),
  };

  await saveJob(job);
  void processVideoUploadQueue();
  return job.id;
};

export const startVideoUploadQueue = () => {
  if (started || typeof indexedDB === "undefined") return;
  started = true;

  void processVideoUploadQueue();
  window.addEventListener("online", () => void processVideoUploadQueue());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void processVideoUploadQueue();
  });
  setInterval(() => void processVideoUploadQueue(), 30000);
};
