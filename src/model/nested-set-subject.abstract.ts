import { Collection } from "@mikro-orm/core";

export abstract class NestedSetSubjectAbstract<T> {

  constructor() {
    this.left = 0
    this.right = 0
    this.nextChildrenIndex = 0
    this.recalculatedLeft = false
    this.recalculatedRight = false
  }


  left: number;

  right: number;

  depth: number;

  nextChildrenIndex: number

  recalculatedLeft : boolean

  recalculatedRight : boolean

  computeSessionToken: string;

  abstract parent: T & NestedSetSubjectAbstract<T> | null

  abstract children: Collection<T & NestedSetSubjectAbstract<T>>

  abstract getIdentifier() : number | string

  getNextChild(computeSessionToken: string) : NestedSetSubjectAbstract<T> {

    if(this.computeSessionToken !== computeSessionToken) {
      this.computeSessionToken = computeSessionToken
      this.nextChildrenIndex = 0
    }

    if(!this.nextChildrenIndex) {
      this.nextChildrenIndex = 0
    }

    return this.children.getItems()[this.nextChildrenIndex++] as unknown as NestedSetSubjectAbstract<T>
  }

  hasAnyChildLeft(computeSessionToken: string) : boolean {

    if(this.computeSessionToken !== computeSessionToken) {
      this.computeSessionToken = computeSessionToken
      this.nextChildrenIndex = 0
    }

    if(!this.nextChildrenIndex) {
      this.nextChildrenIndex = 0
    }

    return this.nextChildrenIndex < this.children.length
  }
}