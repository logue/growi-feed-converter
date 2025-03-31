# growi-feed-converter

Growi の API から RSS/Atom フィードを出力するアプリ。

## 使い方

```text
http://[このスクリプトを設置しているホスト名]?url=https://demo.growi.org&limit=10&title=Growi&description=Growi%20RecentChanges
```

| パラメータ  | 意味                          | デフォルト           |
| ----------- | ----------------------------- | -------------------- |
| url         | Growi の URL （必須）         |                      |
| limit       | 表示件数                      | 10                   |
| title       | RSS 名                        | Growi                |
| description | 説明文                        | Growi Recent Changes |
| type        | フィードの種類（atom か rss） | rss                  |

## ライセンス

©2025 by Logue.
Licensed under the [MIT License](LICENSE).
