import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-gradient text-5xl font-bold mb-4">
            Tailwind CSS v4 Demo
          </h1>
          <p className="text-xl mb-6">
            最新のTailwind CSSで構築された最新のコンポーネントライブラリなのだ！
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="default">プライマリボタン</Button>
            <Button variant="secondary">セカンダリボタン</Button>
            <Button variant="destructive">アクセントボタン</Button>
            <Button variant="outline">アウトラインボタン</Button>
          </div>
        </header>

        {/* カードセクション */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b pb-2">
            カードコンポーネント
          </h2>
          <p className="mb-6">Tailwind CSS v4のコンテナクエリを使ったレスポンシブカードなのだ</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* デフォルトカード */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">デフォルトカード</h3>
              </CardHeader>
              <CardContent>
                <p>シンプルなデザインのカードコンポーネント。基本的なコンテンツ表示に最適なのだ！</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">詳細を見る</Button>
              </CardFooter>
            </Card>

            {/* エレベーテッドカード */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-primary to-destructive flex items-center justify-center text-white">
                <span className="text-xl font-bold">サンプル画像エリア</span>
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-semibold mb-2">エレベーテッドカード</h3>
                <p className="mb-4">影付きの浮き上がったデザインのカード。注目コンテンツに最適なのだ！</p>
                <Button variant="destructive">詳細</Button>
              </CardContent>
            </Card>

            {/* アウトラインカード */}
            <Card className="border-2">
              <CardHeader>
                <h3 className="text-xl font-semibold">アウトラインカード</h3>
              </CardHeader>
              <CardContent>
                <p>境界線のみのシンプルなデザイン。軽量で控えめな表示が必要な場合に使用するのだ！</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost">キャンセル</Button>
                <Button variant="default">確認</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* コンテナクエリのデモ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b pb-2">
            コンテナクエリ
          </h2>
          <p className="mb-4">ブラウザの幅に関係なく、親要素のサイズに基づいてレイアウトが変化するのだ！</p>

          <div className="resize-x overflow-auto border p-4 max-w-full mb-8">
            <div className="@container min-w-[200px] w-full">
              <div className="bg-muted rounded-lg p-6
                          @xs:grid @xs:grid-cols-1 
                          @sm:grid-cols-2 
                          @md:grid-cols-3 
                          @lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <Card key={`card-${num}`} className="mb-4 @sm:mb-0">
                    <CardContent className="p-4">
                      <h4 className="text-lg font-semibold mb-2">カード {num}</h4>
                      <p>コンテナサイズに応じてレイアウトが変化するのだ！</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-4 text-sm text-muted-foreground">
                ↑ 横にリサイズしてコンテナクエリの効果を確認するのだ！ ↑
              </div>
            </div>
          </div>
        </section>

        {/* トランジションとアニメーション */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b pb-2">
            トランジションとアニメーション
          </h2>
          <p className="mb-6">@starting-styleを使ったトランジション効果なのだ</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="fade-in">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium mb-2">フェードイン効果</h4>
                <p>ページ読み込み時にフェードインするエレメントなのだ</p>
              </CardContent>
            </Card>
            
            <Button 
              className="h-full transition-all fade-in" 
              variant="outline"
            >
              ホバーでスタイル変化するのだ
            </Button>
            
            <Card className="animated-underline fade-in">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium mb-2">アンダーラインアニメーション</h4>
                <p>ホバー時にアンダーラインが表示されるのだ</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* カラーミックス機能 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b pb-2">
            カラーミックス機能
          </h2>
          <p className="mb-6">CSSのcolor-mix()関数を使った色の混合なのだ</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg bg-primary" />
              <span className="mt-2">Primary</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, hsl(var(--primary)) 75%, hsl(var(--destructive)) 25%)" }} />
              <span className="mt-2">Mix 75/25</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, hsl(var(--primary)) 50%, hsl(var(--destructive)) 50%)" }} />
              <span className="mt-2">Mix 50/50</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, hsl(var(--primary)) 25%, hsl(var(--destructive)) 75%)" }} />
              <span className="mt-2">Mix 25/75</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg bg-destructive" />
              <span className="mt-2">Destructive</span>
            </div>
          </div>
        </section>

        {/* フォーム要素 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b pb-2">
            フォーム要素のサイズ統一
          </h2>
          <p className="mb-6">field-sizing プロパティを使用したフォーム要素の一貫したサイジングなのだ</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div>
                    <label htmlFor="normal-input" className="block mb-2">通常の入力</label>
                    <input
                      id="normal-input"
                      type="text"
                      placeholder="入力してください"
                      className="p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="normal-select" className="block mb-2">通常の選択</label>
                    <select
                      id="normal-select"
                      className="p-2 border rounded"
                      aria-label="通常のセレクト要素"
                    >
                      <option>選択してください</option>
                      <option>オプション 1</option>
                      <option>オプション 2</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div>
                    <label htmlFor="sizing-input" className="block mb-2">field-sizing入力</label>
                    <input
                      id="sizing-input"
                      type="text"
                      placeholder="入力してください"
                      className="field-sizing:content p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="sizing-select" className="block mb-2">field-sizing選択</label>
                    <select
                      id="sizing-select"
                      className="field-sizing:content p-2 border rounded"
                      aria-label="field-sizingを適用したセレクト要素"
                    >
                      <option>選択してください</option>
                      <option>オプション 1</option>
                      <option>オプション 2</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
