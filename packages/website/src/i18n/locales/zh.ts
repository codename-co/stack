import type { I18n } from "~/i18n/locales";

export const zh: I18n = {
  /** Generic */
  Download: "下载",
  Recipes: "食谱",
  Catalog: "软件目录",
  Back: "返回",
  "No description provided.": "未提供描述。",

  /** Page / */
  "The best of free software, accessible": "最好的免费软件，易于访问",
  "The *best free software* made&nbsp;*accessible*.":
    "最好的免费软件，使之*易于访问*。",
  "Spin up local alternatives to": "启动本地替代方案",
  "and other": "和其他",
  "popular software": "热门软件",
  "Remix your own.": "",
  "Available for macOS": "适用于 macOS",
  "★ {starCount} cumulative stars": "★ {starCount} 累积星星",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "访问 {count}+ 精选的开源软件包，一键安装。",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "免费、安全、关注隐私的替代方案 [流行应用]({url})。",
  "Then install software in one-click ↓": "然后在一键安装软件 ↓",
  "Search software": "搜索软件",
  "a smart alternative to {apps}": "对 {apps} 的智能替代方案",

  /** Page /alternativesto */
  "Alternatives to popular software": "热门软件的替代方案",
  "The open source ecosystem is *awe-inspiring*.": "开源生态系统令人*惊叹*。",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "社区已经为热门软件创建了许多高质量的开源替代方案。在下面发现我们精选的令人惊叹的替代方案列表。",
  "Kinda *popular software* and their open counterparts":
    "有点 *热门软件* 及其开源对应品",
  "Recognize these *popular software*?": "认识这些 *热门软件* 吗？",
  "You'll love their *open source counterparts*": "您会喜欢他们的 *开源对应品*",
  "Browse *by category*": "按 *类别* 浏览",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "{app} 的替代方案",
  "Sure, {logo} {name} is *awesome*.": "当然，{logo} {name} *很棒*。",
  "But have you considered these open source alternatives?":
    "但您考虑过这些开源替代方案吗？",
  "They are free, self-hostable and community-driven.":
    "它们是免费的，可自托管的，并由社区驱动。",
  "Check by yourself: ": "自己检查一下：",
  "So is {logo} *[{name}]({url})*": "所以是 {logo} *[{name}]({url})*",
  "Read more about {name}": "了解更多关于 {name}",

  /** Page /download */
  "Download Stack": "下载 Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "赋予您的桌面 *超能力*。<br />让它在瞬间运行任何开源优质软件。",
  "Download for {os}": "下载 {os}",
  "Requires {os} {version} or later": "需要 {os} {version} 或更高版本",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "正在下载 {os} 的 Stack…",
  "Once the download is complete": "下载完成后",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "通过双击下载的文件安装 Stack 应用。然后将其拖到您的应用程序文件夹中。",
  "Run the Stack app from your Applications folder.":
    "从您的应用程序文件夹中运行 Stack 应用。",

  /** Page /<stack> */
  "Start it now": "现在开始",
  "Download the stack file": "下载堆栈文件",
  "About *{name}*": "关于 *{name}*",
  "Environment variables": "环境变量",
  "No environment variables defined.": "未定义环境变量。",
  "View environment variables": "查看环境变量",
  "An alternative to": "一个替代方案",
  Related: "相关",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} 正在启动…",
  "{name} {version} is live.": "{name} {version} 已上线。",
  "Access it in fullscreen": "全屏访问",

  /** Page /recipes */
  Recipe: "食谱",
  "*Curated Recipes* of powerful stack combinations.":
    "*精选食谱*，强大的堆栈组合。",
  "Recipes are curated stack combinations. Each recipe is a collection of stacks that work well together.":
    "食谱是经过精心挑选的堆栈组合。每个食谱都是一组能够很好地配合使用的堆栈。",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*食谱*：{name}",
  "Recipe ingredients": "食谱成分",
  "Last update": "最后更新",
  "Related recipes": "相关食谱",

  /** Component Debug */
  "Service is running…": "服务正在运行…",
} as const;
