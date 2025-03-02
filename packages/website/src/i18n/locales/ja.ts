import type { I18n } from "~/i18n/locales";

export const ja: I18n = {
  /** Generic */
  Download: "ダウンロード",
  Back: "戻る",

  /** Page / */
  "The best of free software, accessible":
    "最高の無料ソフトウェア、アクセス可能",
  "The *best free software* made&nbsp;*accessible*.":
    "最高の無料ソフトウェアを*アクセス可能に*。",
  "Spin up local alternatives to": "ローカルの代替を開始",
  "and other": "その他",
  "popular software": "人気のあるソフトウェア",
  "Remix your own.": "",
  "Available for macOS": "macOS用",
  "Simply the best": "単に最高",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "{count}以上のキュレーションされたオープンソースソフトウェアパッケージにアクセスし、ワンクリックでインストールできます。",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "[人気のアプリ]({url})の無料で安全でプライバシーに配慮した代替。",
  "Search software": "ソフトウェアを検索",
  "a smart alternative to {apps}": "{apps}のスマートな代替",

  /** Page /alternativesto */
  "Alternatives to popular software": "人気ソフトウェアの代替",
  "The open source ecosystem is *awe-inspiring*.":
    "オープンソースエコシステムは*感動的*です。",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "コミュニティは、人気のあるソフトウェアの高品質でオープンソースの代替を多数作成しています。以下の素晴らしい代替のキュレーションリストをご覧ください。",
  "Kinda *popular software* and their open counterparts":
    "ある種の*人気ソフトウェア*とそのオープンな対応",
  "Recognize these *popular software*?":
    "これらの*人気ソフトウェア*を認識しますか？",
  "You'll love their *open source counterparts*":
    "彼らの*オープンソースの対応*が好きになるでしょう",
  "Browse *by category*": "*カテゴリー別*で閲覧",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "{app}の代替",
  "Sure, {logo} {name} is *awesome*.":
    "確かに、{logo} {name}は*素晴らしい*です。",
  "But have you considered these open source alternatives?":
    "しかし、これらのオープンソースの代替を考慮しましたか？",
  "They are free, self-hostable and community-driven.":
    "それらは無料で、自己ホスト可能で、コミュニティ主導です。",
  "Check by yourself: ": "自分で確認してください：",
  "So is {logo} *[{name}]({url})*": "{logo} *[{name}]({url})*も",
  "Read more about {name}": "{name}について詳しく",

  /** Page /download */
  "Download Stack Desktop": "Stack Desktopをダウンロード",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "デスクトップに*スーパーパワー*を与えます。<br />オープンソースの高品質ソフトウェアを瞬時に実行できます。",
  "Download for {os}": "{os}用にダウンロード",
  "Requires {os} {version} or later": "{os} {version}以降が必要です",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "{os}用のStackをダウンロード中…",
  "Once the download is complete": "ダウンロードが完了したら",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "ダウンロードしたファイルをダブルクリックしてStackアプリをインストールします。次に、それをアプリケーションフォルダにドラッグします。",
  "Run the Stack app from your Applications folder.":
    "アプリケーションフォルダからStackアプリを実行します。",

  /** Page /<stack> */
  "Start it now": "今すぐ開始",
  "Download the stack file": "スタックファイルをダウンロード",
  "About *{name}*": "*{name}* について",
  "Environment variables": "環境変数",
  "No environment variables defined.": "環境変数が定義されていません。",
  "View environment variables": "環境変数を表示",
  "An alternative to": "代替",
  Related: "関連",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} が起動中…",
  "{name} {version} is live.": "{name} {version} が起動しました。",
  "Access it in fullscreen": "フルスクリーンでアクセス",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*レシピ*：{name}",
  "Recipe ingredients": "レシピの材料",
  "Last update": "最終更新",

  /** Component Debug */
  "Service is running…": "サービスが実行中…",
} as const;
