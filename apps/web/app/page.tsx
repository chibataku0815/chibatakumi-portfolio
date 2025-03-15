/**
 * メインページコンポーネント
 * ホーム、プロジェクト、情報セクションを含むポートフォリオページ
 */
import Image from "next/image";

export default function Home() {
  return (
    <main>
      <section id="home" className="home w-screen h-screen bg-bg flex justify-center items-center text-center">
        <h1 className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase text-copy text-[20vw] font-extrabold -tracking-[0.5rem] leading-none clip-polygon">
          <span className="char char-relative">P</span>
          <span className="char char-relative">O</span>
          <span className="char char-relative">R</span>
          <span className="char char-relative">T</span>
          <span className="char char-relative">F</span>
          <span className="char char-relative">O</span>
          <span className="char char-relative">L</span>
          <span className="char char-relative">I</span>
          <span className="char char-relative">O</span>
        </h1>
      </section>

      <section id="projects" className="projects w-screen h-full min-h-screen bg-bg py-80 px-4">
        <div className="images w-[30%] mx-auto flex flex-col gap-8">
          <div className="image relative aspect-video">
            <Image src="/images/project1.jpg" alt="Project 1" fill className="object-cover" />
          </div>
          <div className="image relative aspect-video">
            <Image src="/images/project2.jpg" alt="Project 2" fill className="object-cover" />
          </div>
          <div className="image relative aspect-video">
            <Image src="/images/project3.jpg" alt="Project 3" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section id="info" className="info w-screen h-full min-h-screen bg-bg flex">
        <div className="col flex-1" />
        <div className="col flex-1 p-8 flex justify-center items-center">
          <p className="font-medium text-4xl text-copy">
            <div className="line clip-polygon">
              <span className="line-span-relative">Welcome to my portfolio.</span>
            </div>
            <div className="line clip-polygon">
              <span className="line-span-relative">I am a web developer.</span>
            </div>
          </p>
        </div>
      </section>
    </main>
  )
}