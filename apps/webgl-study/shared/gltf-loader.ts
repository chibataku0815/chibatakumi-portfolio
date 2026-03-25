import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const DRACO_DECODER_PATH =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

export async function loadGLTF(
  url: string,
  useDraco = false,
): Promise<GLTF> {
  const loader = new GLTFLoader();

  if (useDraco) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(dracoLoader);
  }

  return loader.loadAsync(url);
}
