/**
 * 3Dフローティングギャラリーの実装例を表示するページ
 */

import { FloatingGallery } from "../components/floating-gallery/FloatingGallery"

const galleryImages = [
  { id: '1', src: '/images/examples/img1.jpeg', alt: 'Gallery image 1' },
  { id: '2', src: '/images/examples/img2.jpeg', alt: 'Gallery image 2' },
  { id: '3', src: '/images/examples/img3.jpeg', alt: 'Gallery image 3' },
  { id: '4', src: '/images/examples/img4.jpeg', alt: 'Gallery image 4' },
  { id: '5', src: '/images/examples/img5.jpeg', alt: 'Gallery image 5' },
  { id: '6', src: '/images/examples/img6.jpeg', alt: 'Gallery image 6' },
  { id: '7', src: '/images/examples/img7.jpeg', alt: 'Gallery image 7' },
  { id: '8', src: '/images/examples/img8.jpeg', alt: 'Gallery image 8' },
  { id: '9', src: '/images/examples/img9.jpeg', alt: 'Gallery image 9' },
  { id: '10', src: '/images/examples/img10.jpeg', alt: 'Gallery image 10' },
]

const titles = [
  { id: 'creative', text: 'Creative' },
  { id: 'dynamic', text: 'Dynamic' },
  { id: 'innovative', text: 'Innovative' },
  { id: 'powerful', text: 'Powerful' },
]

export default function Page() {
  return (
    <main>
      <FloatingGallery images={galleryImages} titles={titles} />
    </main>
  )
}

// メタデータの設定
export const metadata = {
  title: 'Examples - 3D Floating Gallery',
  description: 'Example implementation of 3D floating gallery with GSAP animations',
} 