/* eslint-disable */
import { MemorixBase } from "@memorix/client-redis";

class MemorixGpio extends MemorixBase {
  protected namespaceNameTree = ["gpio"];

  pubsub = {
    hello: this.getPubsubItemNoKey<boolean>("hello"),
  };
}

export class Memorix extends MemorixBase {
  protected namespaceNameTree = [];

  gpio = this.getNamespaceItem(MemorixGpio);
}
