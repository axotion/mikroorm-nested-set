export class CurrentLeftRightNode {

  left : number;

  right : number;

  constructor() {
    this.left = 0
    this.right = 0
  }

  getNextLeft() : number {
    this.left++;
    return this.left + this.right;
  }

  getNextRight() : number {
    this.right++;
    return this.left + this.right
  }

}