import type { I18n } from "~/i18n/locales";

export const ko: I18n = {
  /** Generic */
  Download: "다운로드",
  Back: "뒤로",

  /** Page / */
  "The best of free software, accessible": "최고의 무료 소프트웨어, 접근 가능",
  "The *best free software* made&nbsp;*accessible*.":
    "최고의 무료 소프트웨어를 *접근 가능하게* 만들었습니다.",
  "Spin up local alternatives to": "지역 대안을 시작하십시오",
  "and other": "및 다른",
  "popular software": "인기 있는 소프트웨어",
  "Remix your own.": "",
  "Available for macOS": "macOS용으로 사용 가능",
  "Simply the best": "간단히 최고",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "{count}개 이상의 선별된 오픈 소스 소프트웨어 패키지에 액세스하여 한 번의 클릭으로 설치할 수 있습니다.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "[인기 있는]({url}) 앱에 대한 무료, 안전하고 개인 정보 보호에 중점을 둔 대안.",
  "Search software": "소프트웨어 검색",
  "a smart alternative to {apps}": "{apps}에 대한 스마트한 대안",

  /** Page /alternativesto */
  "Alternatives to popular software": "인기 있는 소프트웨어의 대안",
  "The open source ecosystem is *awe-inspiring*.":
    "오픈 소스 생태계는 *감탄할 만합니다*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "커뮤니티가 인기 있는 소프트웨어에 대한 다양한 고품질 오픈 소스 대안을 만들었습니다. 아래에서 우리가 선별한 놀라운 대안 목록을 확인하세요.",
  "Kinda *popular software* and their open counterparts":
    "종류 *인기 있는 소프트웨어* 및 그들의 오픈 대안",
  "Browse *by category*": "*카테고리별*로 찾아보기",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "{app}의 대안",
  "Sure, {logo} {name} is *awesome*.": "확실히, {logo} {name}은 *멋집니다*.",
  "But have you considered these open source alternatives?":
    "하지만 이 오픈 소스 대안을 고려해 보셨나요?",
  "They are free, self-hostable and community-driven.":
    "무료이며, 자체 호스팅이 가능하며, 커뮤니티가 주도합니다.",
  "Check by yourself: ": "직접 확인하십시오: ",
  "So is {logo} *[{name}]({url})*": "{logo} *[{name}]({url})* 도",
  "Read more about {name}": "{name}에 대해 자세히 알아보기",

  /** Page /download */
  "Download Stack Desktop": "Stack Desktop 다운로드",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "데스크톱에 *슈퍼파워*를 부여하십시오.<br /> 한 번의 클릭으로 어떤 오픈 소스 품질 소프트웨어든 실행하십시오.",
  "Download for {os}": "{os}용 다운로드",
  "Requires {os} {version} or later": "{os} {version} 이상이 필요합니다",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "{os}용 Stack 다운로드 중...",
  "Once the download is complete": "다운로드가 완료되면",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "다운로드한 파일을 두 번 클릭하여 Stack 앱을 설치하십시오. 그런 다음 응용 프로그램 폴더로 끌어다 놓으십시오.",
  "Run the Stack app from your Applications folder.":
    "응용 프로그램 폴더에서 Stack 앱을 실행하십시오.",

  /** Page /<stack> */
  "Start it now": "지금 시작",
  "Download the stack file": "스택 파일 다운로드",
  "About *{name}*": "*{name}* 에 대해",
  "Environment variables": "환경 변수",
  "No environment variables defined.": "정의된 환경 변수가 없습니다.",
  "View environment variables": "환경 변수 보기",
  "An alternative to": "대체제",
  Related: "관련",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} 시작 중...",
  "{name} {version} is live.": "{name} {version}이 활성화되었습니다.",
  "Access it in fullscreen": "전체 화면에서 액세스",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*레시피*: {name}",
  "Recipe ingredients": "레시피 재료",
  "Last update": "마지막 업데이트",

  /** Component Debug */
  "Service is running…": "서비스가 실행 중입니다...",
} as const;
