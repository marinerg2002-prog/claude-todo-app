// localStorage にタスクを保存・読み込みするための小さなストア。
// useSyncExternalStore から使うことで、サーバー描画時は localStorage に触れず、
// ブラウザでのみ安全に読み書きする。

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "claude-todo-app:todos";

const listeners = new Set<() => void>();

// 同じ文字列から毎回新しい配列を作らないようにキャッシュする
// （useSyncExternalStore はスナップショットが安定している必要がある）
let cachedRaw: string | null = null;
let cachedTodos: Todo[] = [];

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.completed === "boolean" &&
    typeof v.createdAt === "number"
  );
}

function parse(raw: string | null): Todo[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isTodo) : [];
  } catch {
    // 壊れたデータが入っていても画面が落ちないようにする
    return [];
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // プライベートブラウズ等で localStorage が使えない場合
    return cachedRaw;
  }
}

export function getTodosSnapshot(): Todo[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTodos = parse(raw);
  }
  return cachedTodos;
}

// サーバー描画時は「まだ読み込んでいない」ことを示す null を返す
export function getTodosServerSnapshot(): Todo[] | null {
  return null;
}

export function subscribeTodos(listener: () => void): () => void {
  listeners.add(listener);
  // 別タブでの変更も反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 保存に成功したら true を返す */
export function saveTodos(todos: Todo[]): boolean {
  const raw = JSON.stringify(todos);
  let ok = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    ok = false;
  }
  // 保存に失敗しても、この画面を開いている間は操作できるようにする
  cachedRaw = raw;
  cachedTodos = todos;
  listeners.forEach((l) => l());
  return ok;
}

export function createTodo(text: string): Todo {
  return { id: createId(), text, completed: false, createdAt: Date.now() };
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
