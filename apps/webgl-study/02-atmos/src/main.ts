import { Environment } from "./scene/Environment";

const canvas = document.createElement("canvas");
document.body.prepend(canvas);

const env = new Environment(canvas);
env.start();
