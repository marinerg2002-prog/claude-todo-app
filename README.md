# やることリスト（ToDoアプリ）

Next.js（App Router）・TypeScript・Tailwind CSS で作った日本語のToDoリストです。
タスクはブラウザの localStorage に保存されるため、ブラウザを閉じても残ります。

## 機能

- タスクの追加（空欄では追加できません）
- チェックボックスで完了・未完了の切り替え
- 確認ダイアログ付きのタスク削除
- 操作結果のお知らせ表示
- localStorage への自動保存（別タブの変更も反映）

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

本番ビルドの確認:

```bash
npm run build
npm run start
```

## 公開（GitHub + Vercel）

1. GitHub にリポジトリを作成し、このプロジェクトを push します。
2. [Vercel](https://vercel.com/new) で GitHub リポジトリをインポートします。
3. 設定はそのままで「Deploy」を押せば公開されます（環境変数は不要です）。

## 主なファイル

- `src/app/page.tsx` … トップページ
- `src/components/TodoApp.tsx` … ToDo画面（追加・切り替え・削除・確認ダイアログ）
- `src/lib/todo-storage.ts` … localStorage の安全な読み書き
