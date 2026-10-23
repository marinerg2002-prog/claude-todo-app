"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  type Todo,
  createTodo,
  getTodosServerSnapshot,
  getTodosSnapshot,
  saveTodos,
  subscribeTodos,
} from "@/lib/todo-storage";

const MAX_LENGTH = 100;

type Notice = { id: number; message: string; tone: "success" | "info" | "error" };

// 同じ文言が続いてもアニメーションし直すための通し番号
let noticeSeq = 0;

export default function TodoApp() {
  const todos = useSyncExternalStore<Todo[] | null>(
    subscribeTodos,
    getTodosSnapshot,
    getTodosServerSnapshot,
  );
  const [text, setText] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeDialog = useCallback(() => setPendingDelete(null), []);

  const isLoading = todos === null;
  const list = todos ?? [];
  const trimmed = text.trim();
  const canAdd = !isLoading && trimmed.length > 0;
  const remaining = list.filter((t) => !t.completed).length;

  // お知らせは数秒後に自動で消す
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  function notify(message: string, tone: Notice["tone"] = "success") {
    setNotice({ id: ++noticeSeq, message, tone });
  }

  function persist(next: Todo[], message: string, tone: Notice["tone"] = "success") {
    if (saveTodos(next)) {
      notify(message, tone);
    } else {
      notify("保存できませんでした。ブラウザの設定をご確認ください", "error");
    }
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canAdd) {
      notify("タスクの内容を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    persist([createTodo(trimmed), ...list], `「${trimmed}」を追加しました`);
    setText("");
    inputRef.current?.focus();
  }

  function handleToggle(id: string) {
    const target = list.find((t) => t.id === id);
    if (!target) return;
    const next = list.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    persist(
      next,
      target.completed ? `「${target.text}」を未完了に戻しました` : `「${target.text}」を完了にしました`,
      target.completed ? "info" : "success",
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    persist(
      list.filter((t) => t.id !== pendingDelete.id),
      `「${pendingDelete.text}」を削除しました`,
      "info",
    );
    setPendingDelete(null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-slate-700 sm:text-4xl">
          やることリスト
        </h1>
        <p className="mt-2 text-base text-slate-500">
          今日やることを書きとめておきましょう
        </p>
      </header>

      <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="todo-input" className="sr-only">
            新しいタスク
          </label>
          <input
            id="todo-input"
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="例：牛乳を買う"
            autoComplete="off"
            className="min-h-14 flex-1 rounded-2xl border-2 border-sky-100 bg-sky-50/40 px-4 text-lg text-slate-700 placeholder:text-slate-400 transition focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={!canAdd}
            className="min-h-14 rounded-2xl bg-sky-400 px-6 text-lg font-bold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            追加する
          </button>
        </form>
        <p className="mt-2 text-right text-sm text-slate-400">
          {text.length} / {MAX_LENGTH} 文字
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-sky-50 pt-4 text-base text-slate-500">
          <span>
            全 <strong className="text-slate-700">{list.length}</strong> 件
          </span>
          <span>
            残り <strong className="text-sky-600">{remaining}</strong> 件
          </span>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-lg text-slate-400">読み込み中…</p>
        ) : list.length === 0 ? (
          <div className="py-12 text-center">
            <div aria-hidden className="mb-3 text-5xl">📝</div>
            <p className="text-lg font-bold text-slate-600">タスクはまだありません</p>
            <p className="mt-1 text-base text-slate-500">
              上の入力欄にやることを書いて「追加する」を押してください
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {list.map((todo) => (
              <li
                key={todo.id}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition sm:p-4 ${
                  todo.completed
                    ? "border-slate-100 bg-slate-50"
                    : "border-sky-100 bg-white"
                }`}
              >
                <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id)}
                    className="size-7 shrink-0 cursor-pointer accent-sky-400"
                  />
                  <span
                    className={`break-all text-lg leading-relaxed ${
                      todo.completed ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {todo.text}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setPendingDelete(todo)}
                  aria-label={`「${todo.text}」を削除`}
                  className="min-h-12 shrink-0 rounded-xl border-2 border-rose-100 px-4 text-base font-bold text-rose-400 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-sm text-slate-400">
        タスクはこのブラウザに自動で保存されます
      </p>

      {/* 操作結果のお知らせ（スクリーンリーダーにも読み上げられる） */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      >
        {notice && (
          <div
            key={notice.id}
            className={`animate-toast rounded-full px-6 py-3 text-base font-bold shadow-lg ${
              notice.tone === "error"
                ? "bg-rose-500 text-white"
                : notice.tone === "info"
                  ? "bg-slate-600 text-white"
                  : "bg-sky-500 text-white"
            }`}
          >
            {notice.message}
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          todo={pendingDelete}
          onCancel={closeDialog}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  todo,
  onCancel,
  onConfirm,
}: {
  todo: Todo;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-xl font-bold text-slate-700">
          タスクを削除しますか？
        </h2>
        <p id="confirm-desc" className="mt-3 text-base text-slate-600">
          「<span className="break-all font-bold">{todo.text}</span>」を削除します。
          <br />
          この操作は元に戻せません。
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-2xl border-2 border-slate-200 px-5 text-base font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-2xl bg-rose-400 px-5 text-base font-bold text-white transition hover:bg-rose-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
