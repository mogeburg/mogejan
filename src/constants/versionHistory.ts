import { VERSION } from "@/constants/game";

export type VersionHistoryEntry = {
  version: string;
  summary?: string | string[];
  children?: VersionHistoryEntry[];
  defaultOpen?: boolean;
};

export const VERSION_HISTORY: VersionHistoryEntry[] = [
  {
    version: `${VERSION}`,
    summary: "流行牌・特殊役を追加した",
    defaultOpen: true,
    children: [
      {
        version: "0.02",
        summary: [
          "特殊役、流行牌を追加",
          "対局中の演出を強化",
          "自動ツモ・ロン、ポン・キャンセル、リーチ機能を追加",
          "設定に履歴タブ、データリセット、タイトルに戻るを追加",
          "favicon、OGPの見直し",
          "URL変更、GitHubへ移行",
          "その他、細かい箇所を修正",
        ],
      },
    ],
  },
  {
    version: "0.01",
    children: [
      {
        version: "0.01",
        summary: "たぶん動くからアップロード",
      },
      {
        version: "0.011",
        summary: "画像ロード改善、メニューボタン追加",
      },
      {
        version: "0.0111",
        summary: "細かいUX修正、誤字対応",
      },
    ],
  },
];
