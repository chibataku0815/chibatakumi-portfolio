import Button from './components/Button';
import Card, { CardHeader, CardBody, CardFooter, CardMedia } from './components/Card';

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
            <Button intent="primary">プライマリボタン</Button>
            <Button intent="secondary">セカンダリボタン</Button>
            <Button intent="accent" rounded>アクセントボタン</Button>
            <Button intent="outline">アウトラインボタン</Button>
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
              <CardBody>
                <p>シンプルなデザインのカードコンポーネント。基本的なコンテンツ表示に最適なのだ！</p>
              </CardBody>
              <CardFooter>
                <Button size="sm" fullWidth>詳細を見る</Button>
              </CardFooter>
            </Card>

            {/* エレベーテッドカード */}
            <Card variant="elevated" padding="none">
              <div className="h-48 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white">
                <span className="text-xl font-bold">サンプル画像エリア</span>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">エレベーテッドカード</h3>
                <p className="mb-4">影付きの浮き上がったデザインのカード。注目コンテンツに最適なのだ！</p>
                <Button intent="accent" size="sm">詳細</Button>
              </div>
            </Card>

            {/* アウトラインカード */}
            <Card variant="outline" clickable>
              <CardHeader>
                <h3 className="text-xl font-semibold">アウトラインカード</h3>
              </CardHeader>
              <CardBody>
                <p>境界線のみのシンプルなデザイン。軽量で控えめな表示が必要な場合に使用するのだ！</p>
              </CardBody>
              <CardFooter>
                <div className="flex justify-between">
                  <Button intent="ghost" size="sm">キャンセル</Button>
                  <Button intent="primary" size="sm">確認</Button>
                </div>
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
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6
                          @xs:grid @xs:grid-cols-1 
                          @sm:grid-cols-2 
                          @md:grid-cols-3 
                          @lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={`card-${num}`} className="bg-white dark:bg-zinc-700 rounded p-4 mb-4 @sm:mb-0">
                    <h4 className="text-lg font-semibold mb-2">カード {num}</h4>
                    <p>コンテナサイズに応じてレイアウトが変化するのだ！</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4 text-sm text-zinc-500">
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
            <div className="fade-in p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
              <h4 className="text-lg font-medium mb-2">フェードイン効果</h4>
              <p>ページ読み込み時にフェードインするエレメントなのだ</p>
            </div>
            
            <Button 
              className="h-full transition-all fade-in" 
              intent="outline"
            >
              ホバーでスタイル変化するのだ
            </Button>
            
            <div className="animated-underline fade-in p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
              <h4 className="text-lg font-medium mb-2">アンダーラインアニメーション</h4>
              <p>ホバー時にアンダーラインが表示されるのだ</p>
            </div>
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
              <div className="h-20 w-full rounded-lg" style={{ background: "var(--color-primary)" }} />
              <span className="mt-2">Primary</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, var(--color-primary) 75%, var(--color-accent) 25%)" }} />
              <span className="mt-2">Mix 75/25</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, var(--color-primary) 50%, var(--color-accent) 50%)" }} />
              <span className="mt-2">Mix 50/50</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "color-mix(in srgb, var(--color-primary) 25%, var(--color-accent) 75%)" }} />
              <span className="mt-2">Mix 25/75</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-full rounded-lg" style={{ background: "var(--color-accent)" }} />
              <span className="mt-2">Accent</span>
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
            <div>
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
            </div>
            
            <div>
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
